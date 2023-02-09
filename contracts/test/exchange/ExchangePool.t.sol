// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {TickMath} from "../../exchange/libraries/TickMath.sol";
import "forge-std/Test.sol";
import {ExchangePoolFactory} from "../../exchange/ExchangePoolFactory.sol";
import {ExchangePool} from "../../exchange/ExchangePool.sol";
import {NonfungiblePositionManager} from "../../exchange/periphery/NonfungiblePositionManager.sol";
import {PoolAddress} from "../../exchange/periphery/libraries/PoolAddress.sol";
import {INonfungiblePositionManager} from "../../exchange/periphery/interfaces/INonfungiblePositionManager.sol";
import {NonfungibleTokenPositionDescriptor} from "../../exchange/periphery/NonfungibleTokenPositionDescriptor.sol";
import {WETH9} from "../../lib/WETH9.sol";
import {ExchangeFixture} from '../utils/ExchangeFixture.sol';
import {OracleLibrary} from "../../exchange/periphery/libraries/OracleLibrary.sol";
import {ISwapRouter} from "../../exchange/periphery/interfaces/ISwapRouter.sol";

contract ExchangePoolTest is ExchangeFixture {

    function setUp() public override {
        super.setUp();
    }



    function testMint() public {
        exchangeAddLiquidity(token, stablecoin);
    }


    function testSwap() public {
        exchangeAddLiquidity(token, stablecoin);
        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = address(stablecoin);
        token.approve(address(router), 30000);
        exchangeSwapExactInput(path, 10000, 0);
        exchangeSwapExactInput(path, 10000, 0);
    }

    function testOracle() public {
        exchangeAddLiquidity(token, stablecoin);
        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = address(stablecoin);
        token.approve(address(router), 30000);
        emit log_named_uint("block number", block.number);
        emit log_named_uint("block timestamp", block.timestamp);
        exchangeSwapExactInput(path, 10000, 0);
        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);
        exchangeSwapExactInput(path, 10000, 0);
        emit log_named_uint("block number", block.number);
        emit log_named_uint("block timestamp", block.timestamp);
        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);
        (int24 arithmeticMeanTick, uint128 harmonicMeanLiquidity) =
            OracleLibrary.consult(address(pool), 1);
        emit log_named_int("arithmeticMeanTick", arithmeticMeanTick);
        emit log_named_uint("harmonicMeanLiquidity", harmonicMeanLiquidity);
        // Returns the amount of token we can receive for 1 stablecoing
        (uint256 quoteAmount) = OracleLibrary.getQuoteAtTick(arithmeticMeanTick, 1e18, address(stablecoin), address(token));
        emit log_named_uint("quoteAmount (1e18)", quoteAmount);
        // since we converted token into stablecoin (sold token), it means we
        // decreased the price of token slightly. therefore, for 1 stablecoin,
        // we should receive more than 1 token.
    }
}
