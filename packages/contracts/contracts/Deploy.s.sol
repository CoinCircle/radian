// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import 'forge-std/Script.sol';
import 'forge-std/Vm.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ExchangePoolFactory} from './exchange/ExchangePoolFactory.sol';
import {SwapRouter} from './exchange/periphery/SwapRouter.sol';
import {WETH9} from './lib/WETH9.sol';
import {NonfungiblePositionManager} from './exchange/periphery/NonfungiblePositionManager.sol';
import {NonfungibleTokenPositionDescriptor} from './exchange/periphery/NonfungibleTokenPositionDescriptor.sol';

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

contract DeployScript is Script {
  function run() external {
    uint256 deployerPrivateKey = vm.deriveKey(vm.envString('MNEMONIC'), uint32(0));
    address pub = vm.addr(deployerPrivateKey);
    vm.startBroadcast(deployerPrivateKey);

    ExchangePoolFactory factory = new ExchangePoolFactory();
    WETH9 weth = new WETH9();
    SwapRouter router = new SwapRouter(address(factory), address(weth));

    Token token = new Token(
      'Token',
      'TKN',
      1e24, // 1 million
      address(pub)
    );
    Token stablecoin = new Token(
      'USDX',
      'USDX',
      1e24, // 1 million
      address(pub)
    );
    // deploy descriptor
    NonfungibleTokenPositionDescriptor nftDescriptor = new NonfungibleTokenPositionDescriptor(
      address(weth),
      bytes32('ETH')
    );
    // deploy manager
    NonfungiblePositionManager nftManager = new NonfungiblePositionManager(
      address(factory),
      address(weth),
      address(nftDescriptor)
    );

    vm.stopBroadcast();
  }
}
