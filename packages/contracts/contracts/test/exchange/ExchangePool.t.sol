// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

// import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {TickMath} from "../../exchange/libraries/TickMath.sol";
import "forge-std/Test.sol";
// import {ExchangePoolFactory} from "../../exchange/ExchangePoolFactory.sol";
// import {ExchangePool} from "../../exchange/ExchangePool.sol";
// import {NonfungiblePositionManager} from "../../exchange/periphery/NonfungiblePositionManager.sol";
// import {PoolAddress} from "../../exchange/periphery/libraries/PoolAddress.sol";
// import {INonfungiblePositionManager} from "../../exchange/periphery/interfaces/INonfungiblePositionManager.sol";
// import {NonfungibleTokenPositionDescriptor} from "../../exchange/periphery/NonfungibleTokenPositionDescriptor.sol";
// import {WETH9} from "../../lib/WETH9.sol";
import {ExchangeFixture} from "../utils/ExchangeFixture.sol";
// import {OracleLibrary} from "../../exchange/periphery/libraries/OracleLibrary.sol";
// import {ISwapRouter} from "../../exchange/periphery/interfaces/ISwapRouter.sol";

contract ExchangePoolTest is ExchangeFixture {

    function setUp() public override {
        super.setUp();
    }

    function testCreate2() public {
        address _sender = 0x094499Df5ee555fFc33aF07862e43c90E6FEe501;
        bytes32 _bytecodeHash = 0x01000eff4bc484579bc761c156e3e1ad6f17573a52a6cfa05ffd15d74f2fd219;
        address token0 = 0x111C3E89Ce80e62EE88318C2804920D4c96f92bb;
        address token1 = 0x4B5DF730c2e6b28E17013A1485E5d9BC41Efe021;
        uint24 fee = 3000;
        bytes32 _salt = keccak256(abi.encode(token0, token1, fee));
        bytes32 CREATE2_PREFIX = keccak256("zksyncCreate2");
        bytes32 senderBytes = bytes32(uint256(uint160(_sender)));
        bytes32 _constructorInputHash = keccak256(""); // 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
        bytes32 data = keccak256(
            bytes.concat(CREATE2_PREFIX, senderBytes, _salt, _bytecodeHash, _constructorInputHash)
        );
        emit log_named_bytes32("prefix", CREATE2_PREFIX);
        emit log_named_bytes32("address_bytes", data);
        emit log_named_bytes32("_constructorInputHash", _constructorInputHash);
        emit log_named_address("result", address(uint160(uint256(data))));
    }

    // function testMint() public {
    //     exchangeAddLiquidity(address(token), address(stablecoin));
    // }


    // function testSwap() public {
    //     exchangeAddLiquidity(address(token), address(stablecoin));
    //     address[] memory path = new address[](2);
    //     path[0] = address(token);
    //     path[1] = address(stablecoin);
    //     token.approve(address(router), 30000);
    //     exchangeSwapExactInput(path, 10000, 0);
    //     exchangeSwapExactInput(path, 10000, 0);
    // }

    // function testOracle() public {
    //     exchangeAddLiquidity(address(token), address(stablecoin));
    //     address[] memory path = new address[](2);
    //     path[0] = address(token);
    //     path[1] = address(stablecoin);
    //     token.approve(address(router), 30000);
    //     emit log_named_uint("block number", block.number);
    //     emit log_named_uint("block timestamp", block.timestamp);
    //     exchangeSwapExactInput(path, 10000, 0);
    //     vm.roll(block.number + 1);
    //     vm.warp(block.timestamp + 1);
    //     exchangeSwapExactInput(path, 10000, 0);
    //     emit log_named_uint("block number", block.number);
    //     emit log_named_uint("block timestamp", block.timestamp);
    //     vm.roll(block.number + 1);
    //     vm.warp(block.timestamp + 1);
    //     (int24 arithmeticMeanTick, uint128 harmonicMeanLiquidity) =
    //         OracleLibrary.consult(address(pool), 1);
    //     emit log_named_int("arithmeticMeanTick", arithmeticMeanTick);
    //     emit log_named_uint("harmonicMeanLiquidity", harmonicMeanLiquidity);
    //     // Returns the amount of token we can receive for 1 stablecoing
    //     (uint256 quoteAmount) = OracleLibrary.getQuoteAtTick(arithmeticMeanTick, 1e18, address(stablecoin), address(token));
    //     emit log_named_uint("quoteAmount (1e18)", quoteAmount);
    //     // since we converted token into stablecoin (sold token), it means we
    //     // decreased the price of token slightly. therefore, for 1 stablecoin,
    //     // we should receive more than 1 token.
    // }
}
