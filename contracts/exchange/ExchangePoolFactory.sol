// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

// import {IExchangePoolFactory} from './interfaces/IExchangePoolFactory.sol';

// import {ExchangePoolDeployer} from './ExchangePoolDeployer.sol';

import {ExchangePool} from './ExchangePool.sol';

/// @title Canonical Uniswap V3 factory
/// @notice Deploys Uniswap V3 pools and manages ownership and control over pool protocol fees
contract ExchangePoolFactory {

    address public owner;

    mapping(uint24 => int24) public feeAmountTickSpacing;
    mapping(address => mapping(address => mapping(uint24 => address))) public getPool;

    struct Parameters {
        address factory;
        address token0;
        address token1;
        uint24 fee;
        int24 tickSpacing;
    }

    Parameters public parameters;

    /// @dev Deploys a pool with the given parameters by transiently setting the parameters storage slot and then
    /// clearing it after deploying the pool.
    /// @param factory The contract address of the Uniswap V3 factory
    /// @param token0 The first token of the pool by address sort order
    /// @param token1 The second token of the pool by address sort order
    /// @param fee The fee collected upon every swap in the pool, denominated in hundredths of a bip
    /// @param tickSpacing The spacing between usable ticks
    function deploy(
        address factory,
        address token0,
        address token1,
        uint24 fee,
        int24 tickSpacing
    ) internal returns (address pool) {
        parameters = Parameters({factory: factory, token0: token0, token1: token1, fee: fee, tickSpacing: tickSpacing});
        pool = address(new ExchangePool{salt: keccak256(abi.encode(token0, token1, fee))}());
        delete parameters;
    }

    constructor() {
        owner = msg.sender;

        feeAmountTickSpacing[500] = 10;
        feeAmountTickSpacing[3000] = 60;
        feeAmountTickSpacing[10000] = 200;
    }

    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external  returns (address pool) {
        require(tokenA != tokenB);
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0));
        int24 tickSpacing = feeAmountTickSpacing[fee];
        require(tickSpacing != 0);
        require(getPool[token0][token1][fee] == address(0));
        pool = deploy(address(this), token0, token1, fee, tickSpacing);
        getPool[token0][token1][fee] = pool;
        // populate mapping in the reverse direction, deliberate choice to avoid the cost of comparing addresses
        getPool[token1][token0][fee] = pool;
    }

    // function setOwner(address _owner) external {
    //     require(msg.sender == owner);
    //     owner = _owner;
    // }

    // function enableFeeAmount(uint24 fee, int24 tickSpacing) public {
    //     require(msg.sender == owner);
    //     require(fee < 1000000);
    //     // tick spacing is capped at 16384 to prevent the situation where tickSpacing is so large that
    //     // TickBitmap#nextInitializedTickWithinOneWord overflows int24 container from a valid tick
    //     // 16384 ticks represents a >5x price change with ticks of 1 bips
    //     require(tickSpacing > 0 && tickSpacing < 16384);
    //     require(feeAmountTickSpacing[fee] == 0);

    //     feeAmountTickSpacing[fee] = tickSpacing;
    // }
}
