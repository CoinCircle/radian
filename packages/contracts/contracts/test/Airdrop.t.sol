// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ECDSA} from '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import 'forge-std/Test.sol';
import {Airdrop} from '../radian/Airdrop.sol';

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

contract AirdropTest is Test {
  Airdrop airdrop;
  uint256 priv;
  address pub;

  function setUp() public {
    priv = vm.deriveKey(
      'fever left silver eagle shrimp trumpet faith spin title entire vicious crawl',
      uint32(0)
    );
    pub = vm.addr(priv);
    Token token = new Token('Test Token', 'TST', 1000, address(this));
    airdrop = new Airdrop(pub, address(token));
    token.transfer(address(airdrop), 1000);
  }

  // Test claiming to self (msg.sender)
  function testClaim() public {
    // generate signature
    uint256 amount = 100;
    uint256 nonce = 0;
    bytes memory packed = abi.encodePacked(pub, amount, nonce);
    emit log_bytes(packed);
    bytes32 signedHash = ECDSA.toEthSignedMessageHash(packed);
    emit log_bytes32(signedHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(priv, signedHash);
    emit log_bytes(abi.encodePacked(r, s, v));
    // set msg.sender to self
    vm.prank(pub);
    // claim
    airdrop.claim(amount, nonce, abi.encodePacked(r, s, v));
  }

  // Test claiming to another address
  function testClaimBehalf() public {
    // generate signature
    address to = address(this);
    uint256 amount = 100;
    uint256 nonce = 0;
    bytes memory packed = abi.encodePacked(to, amount, nonce);
    emit log_bytes(packed);
    bytes32 signedHash = ECDSA.toEthSignedMessageHash(packed);
    emit log_bytes32(signedHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(priv, signedHash);
    emit log_bytes(abi.encodePacked(r, s, v));
    // claim
    airdrop.claimBehalf(to, amount, nonce, abi.encodePacked(r, s, v));
  }

  function testDoubleSpendProtection() public {
    testClaim();
    vm.expectRevert();
    testClaim();
  }
}
