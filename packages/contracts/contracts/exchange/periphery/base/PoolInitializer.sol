// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import '../../interfaces/IExchangePoolFactory.sol';
import '../../interfaces/IExchangePool.sol';

import './PeripheryImmutableState.sol';
import '../interfaces/IPoolInitializer.sol';

/// @title Creates and initializes V3 Pools
abstract contract PoolInitializer is IPoolInitializer, PeripheryImmutableState {
  /// @inheritdoc IPoolInitializer
  function createAndInitializePoolIfNecessary(
    address token0,
    address token1,
    uint24 fee,
    uint160 sqrtPriceX96
  ) external payable override returns (address pool) {
    require(token0 < token1);
    pool = IExchangePoolFactory(factory).getPool(token0, token1, fee);

    if (pool == address(0)) {
      pool = IExchangePoolFactory(factory).createPool(token0, token1, fee);
      IExchangePool(pool).initialize(sqrtPriceX96);
    } else {
      (uint160 sqrtPriceX96Existing, , , , , , ) = IExchangePool(pool).slot0();
      if (sqrtPriceX96Existing == 0) {
        IExchangePool(pool).initialize(sqrtPriceX96);
      }
    }
  }
}
