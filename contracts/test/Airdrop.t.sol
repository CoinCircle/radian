// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Test} from "./utils/Test.sol";
import {Airdrop} from "../Airdrop.sol";

contract AirdropTest is Test {
    Airdrop airdrop;

    function setUp() public {
        token = new ERC20(
            "Test Token",
            "TST"
        );
        // mint some tokens
        token.mint(address(this), 1000);
        airdrop = new Airdrop(this, token);
    }

    function testClaim() public {
        // generate signature
        bytes signature = ECDSA.toEthSignedMessageHash(abi.encodePacked(this, 100, 0));
        // claim
        airdrop.claim(100, 0, signature);
    }
}
