pragma solidity ^0.8.0;

import {ExchangeFixture} from './ExchangeFixture.sol';
import {Controller} from '../../perpetuals/Controller.sol';
import {WLongPerp} from '../../perpetuals/WLongPerp.sol';
import {ShortPerp} from '../../perpetuals/ShortPerp.sol';
import {IPerpOracle} from '../../perpetuals/interfaces/IPerpOracle.sol';
import {ExchangeOracle} from '../../lib/ExchangeOracle.sol';
import {ExchangePool} from '../../exchange/ExchangePool.sol';

// Test oracle for a perp that tracks an asset that just moons forever, specifically,
// it increases by $1 every block
contract MoonOracle is IPerpOracle {
  uint256 public constant ONE = 1e18;
  uint256 public constant INITIAL_PRICE = ONE;

  function getIndexPrice() external view returns (uint256) {
    // Increases by $1 every block
    return block.timestamp * ONE;
  }

  function getIndexTwap(uint32 _secondsAgo) external view override returns (uint256) {
    require(_secondsAgo <= block.timestamp, 'MoonOracle: _secondsAgo > block.timestamp');
    // Increases by $1 every block
    return (block.timestamp - _secondsAgo) * ONE;
  }
}

contract PerpetualsFixture is ExchangeFixture {
  Controller public controller;
  WLongPerp public wLongPerp;
  ShortPerp public shortPerp;
  MoonOracle public indexOracle;
  ExchangePool public perpStablecoinPool;
  ExchangeOracle public marketOracle;

  function setUp() public virtual override {
    super.setUp();
    uint feeTier = 3000;
    wLongPerp = new WLongPerp('WLongMoonPerp', 'PERP-MOON-LONG');
    shortPerp = new ShortPerp('ShortMoonPerp', 'PERP-MOON-SHORT');
    indexOracle = new MoonOracle();
    marketOracle = new ExchangeOracle();
    perpStablecoinPool = exchangeCreatePool(address(wLongPerp), address(stablecoin));
    controller = new Controller(
      address(indexOracle),
      address(marketOracle),
      address(shortPerp),
      address(wLongPerp),
      address(stablecoin),
      address(perpStablecoinPool),
      address(nftManager),
      FEE_MEDIUM,
      address(weth)
    );
    emit log_named_address('controller', address(controller));
  }
}
