// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ECDSA} from '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import 'forge-std/Test.sol';
import 'forge-std/console.sol';
import {HyperOracle} from '../../oracle/HyperOracle.sol';
// import "../utils/Vm.sol";

contract Token is ERC20 {
  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    address _owner
  ) ERC20(_name, _symbol) {
    _mint(_owner, _totalSupply);
  }
}

contract HyperOracleTest is Test {
  HyperOracle oracle;
  uint256 priv;
  address pub;

  function setUp() public {
    priv = vm.deriveKey(
      'fever left silver eagle shrimp trumpet faith spin title entire vicious crawl',
      uint32(0)
    );
    pub = vm.addr(priv);
    Token token = new Token('Test Token', 'TST', 1000, address(this));

    oracle = new HyperOracle();

    token.transfer(address(this), 1000);
  }

  // Test claiming to self (msg.sender)
  function setPrice(uint price) public {
    oracle.setPrice(price);
  }

  // Test claiming to self (msg.sender)
  function testSetGetPrice() public {
    setPrice(199);
    uint price = oracle.getPrice();
    console.log(price);
    assertEq(price, 199);
  }

  // Test claiming to self (msg.sender)
  function testGetPrice() public {
    uint price = oracle.getPrice();
    console.log(price);
    assertEq(price, 0);
  }

  function testUnauthorized() public {
    vm.startPrank(pub);
    vm.expectRevert();
    setPrice(199);
    uint price = oracle.getPrice();
    console.log(price);
    assertEq(price, 0);
  }
}
