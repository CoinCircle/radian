// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {PerpetualsFixture} from "../utils/PerpetualsFixture.sol";

contract PerpetualsTest is PerpetualsFixture {

    function setUp() public override {
      super.setUp();
    }

    function testMint() public {

    }
}
