pragma solidity ^0.8.0;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {TickMath} from '../../exchange/libraries/TickMath.sol';
import 'forge-std/Test.sol';
import {ExchangePoolFactory} from '../../exchange/ExchangePoolFactory.sol';
import {SwapRouter} from '../../exchange/periphery/SwapRouter.sol';
import {ISwapRouter} from '../../exchange/periphery/interfaces/ISwapRouter.sol';
import {ExchangePool} from '../../exchange/ExchangePool.sol';
import {NonfungiblePositionManager} from '../../exchange/periphery/NonfungiblePositionManager.sol';
import {PoolAddress} from '../../exchange/periphery/libraries/PoolAddress.sol';
import {INonfungiblePositionManager} from '../../exchange/periphery/interfaces/INonfungiblePositionManager.sol';
import {NonfungibleTokenPositionDescriptor} from '../../exchange/periphery/NonfungibleTokenPositionDescriptor.sol';
import {WETH9} from '../../lib/WETH9.sol';

uint256 constant PRECISION = 2 ** 96;

// Computes the sqrt of the u64x96 fixed point price given the AMM reserves
function encodePriceSqrt(uint256 reserve1, uint256 reserve0) pure returns (uint160) {
  return uint160(sqrt((reserve1 * PRECISION * PRECISION) / reserve0));
}

// Fast sqrt, taken from Solmate.
function sqrt(uint256 x) pure returns (uint256 z) {
  assembly {
    // Start off with z at 1.
    z := 1

    // Used below to help find a nearby power of 2.
    let y := x

    // Find the lowest power of 2 that is at least sqrt(x).
    if iszero(lt(y, 0x100000000000000000000000000000000)) {
      y := shr(128, y) // Like dividing by 2 ** 128.
      z := shl(64, z) // Like multiplying by 2 ** 64.
    }
    if iszero(lt(y, 0x10000000000000000)) {
      y := shr(64, y) // Like dividing by 2 ** 64.
      z := shl(32, z) // Like multiplying by 2 ** 32.
    }
    if iszero(lt(y, 0x100000000)) {
      y := shr(32, y) // Like dividing by 2 ** 32.
      z := shl(16, z) // Like multiplying by 2 ** 16.
    }
    if iszero(lt(y, 0x10000)) {
      y := shr(16, y) // Like dividing by 2 ** 16.
      z := shl(8, z) // Like multiplying by 2 ** 8.
    }
    if iszero(lt(y, 0x100)) {
      y := shr(8, y) // Like dividing by 2 ** 8.
      z := shl(4, z) // Like multiplying by 2 ** 4.
    }
    if iszero(lt(y, 0x10)) {
      y := shr(4, y) // Like dividing by 2 ** 4.
      z := shl(2, z) // Like multiplying by 2 ** 2.
    }
    if iszero(lt(y, 0x8)) {
      // Equivalent to 2 ** z.
      z := shl(1, z)
    }

    // Shifting right by 1 is like dividing by 2.
    z := shr(1, add(z, div(x, z)))
    z := shr(1, add(z, div(x, z)))
    z := shr(1, add(z, div(x, z)))
    z := shr(1, add(z, div(x, z)))
    z := shr(1, add(z, div(x, z)))
    z := shr(1, add(z, div(x, z)))
    z := shr(1, add(z, div(x, z)))

    // Compute a rounded down version of z.
    let zRoundDown := div(x, z)

    // If zRoundDown is smaller, use it.
    if lt(zRoundDown, z) {
      z := zRoundDown
    }
  }
}

contract Token is ERC20 {
  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    address _owner
  ) public ERC20(_name, _symbol) {
    _mint(_owner, _totalSupply);
  }
}

contract ExchangeFixture is Test {
  uint24 constant FEE_MEDIUM = 3000;
  Token token;
  Token stablecoin;
  ExchangePoolFactory factory;
  WETH9 weth;
  NonfungibleTokenPositionDescriptor nftDescriptor;
  NonfungiblePositionManager nftManager;
  ExchangePool pool;
  SwapRouter router;

  function setUp() public virtual {
    // Create 2 tokens
    token = new Token(
      'Token',
      'TKN',
      1e24, // 1 million
      address(this)
    );
    stablecoin = new Token(
      'USDX',
      'USDX',
      1e24, // 1 million
      address(this)
    );
    // Create factory
    factory = new ExchangePoolFactory();
    weth = new WETH9();
    vm.deal(address(this), 10000e18);
    // get some weth
    weth.deposit{value: 100e18}();
    // deploy descriptor
    nftDescriptor = new NonfungibleTokenPositionDescriptor(address(weth), bytes32('ETH'));
    // deploy manager
    nftManager = new NonfungiblePositionManager(
      address(factory),
      address(weth),
      address(nftDescriptor)
    );

    pool = exchangeCreatePool(address(token), address(stablecoin));
    router = new SwapRouter(address(factory), address(weth));
  }

  function exchangeCreatePool(address _tokenA, address _tokenB) public returns (ExchangePool) {
    // Create a pool that has liquidity
    int24 tickSpacking = 60;
    uint160 mt = TickMath.getSqrtRatioAtTick(6000);
    // emit log_named_uint("maxtick", mt);
    uint160 mnt = TickMath.getSqrtRatioAtTick(-6000);
    // emit log_named_uint("mintick", mnt);
    ERC20 tokenA = ERC20(_tokenA);
    ERC20 tokenB = ERC20(_tokenB);
    address token0 = address(tokenA) < address(tokenB) ? address(tokenA) : address(tokenB);
    address token1 = address(tokenA) < address(tokenB) ? address(tokenB) : address(tokenA);
    address poolAddress = nftManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      FEE_MEDIUM,
      encodePriceSqrt(1, 1)
    );
    emit log_named_address('deployed pool address', poolAddress);

    // Make sure the determinstic pool address computation is correct
    // NOTE: this only seems to be correct when --force is used (which makes
    // forge re-compile everything without using the cache. I don't know why using
    // the cache causes this to fail.)
    PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({
      token0: token0,
      token1: token1,
      fee: FEE_MEDIUM
    });
    address computedPoolAddress = PoolAddress.computeAddress(address(factory), poolKey);
    emit log_named_address('computedPoolAddress', computedPoolAddress);
    return ExchangePool(poolAddress);
  }

  function exchangeAddLiquidity(address _tokenA, address _tokenB) internal {
    uint256 tokenAmount = 1000000;
    ERC20 tokenA = ERC20(_tokenA);
    ERC20 tokenB = ERC20(_tokenB);
    tokenA.approve(address(nftManager), tokenAmount);
    tokenB.approve(address(nftManager), tokenAmount);
    address token0 = address(tokenA) < address(tokenB) ? address(tokenA) : address(tokenB);
    address token1 = address(tokenA) < address(tokenB) ? address(tokenB) : address(tokenA);
    (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) = nftManager.mint(
      INonfungiblePositionManager.MintParams({
        token0: token0,
        token1: token1,
        fee: FEE_MEDIUM,
        tickLower: -6000,
        tickUpper: 6000,
        amount0Desired: tokenAmount,
        amount1Desired: tokenAmount,
        amount0Min: 0,
        amount1Min: 0,
        recipient: address(this),
        deadline: 1
      })
    );
    emit log_named_uint('tokenId', tokenId);
    emit log_named_uint('liquidity', liquidity);
    emit log_named_uint('amount0', amount0);
    emit log_named_uint('amount1', amount1);
  }

  function encodePath(address[] memory path, uint24[] memory fees) internal returns (bytes memory) {
    bytes memory res;
    for (uint256 i = 0; i < fees.length; i++) {
      res = abi.encodePacked(res, path[i], fees[i]);
    }
    res = abi.encodePacked(res, path[path.length - 1]);
    return res;
  }

  function exchangeSwapExactInput(
    address[] memory tokens,
    uint256 amountIn,
    uint256 amountOutMinimum
  ) public {
    // vm.startPrank(trader);

    bool inputIsWETH = tokens[0] == address(weth);
    bool outputIsWETH = tokens[tokens.length - 1] == address(weth);
    uint256 value = inputIsWETH ? amountIn : 0;

    uint24[] memory fees = new uint24[](tokens.length - 1);
    for (uint256 i = 0; i < fees.length; i++) {
      fees[i] = 3000;
    }

    ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
      path: encodePath(tokens, fees),
      recipient: outputIsWETH ? address(0) : address(this),
      deadline: block.timestamp + 180,
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum
    });

    bytes[] memory data;
    bytes memory inputs = abi.encodeWithSelector(router.exactInput.selector, params);
    if (outputIsWETH) {
      data = new bytes[](2);
      data[0] = inputs;
      data[1] = abi.encodeWithSelector(
        router.unwrapWETH9.selector,
        amountOutMinimum,
        address(this)
      );
    }

    // ensure that the swap fails if the limit is any higher
    // params.amountOutMinimum += 1;
    // vm.expectRevert(bytes('Too little received'));
    // router.exactInput{value: value}(params);
    // params.amountOutMinimum -= 1;

    if (outputIsWETH) {
      router.multicall{value: value}(data);
    } else {
      router.exactInput{value: value}(params);
    }

    // vm.stopPrank();
  }
}
