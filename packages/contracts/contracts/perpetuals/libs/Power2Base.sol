// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.0;

//interface
import {IPerpOracle} from '../interfaces/IPerpOracle.sol';
import {IExchangeOracle} from '../interfaces/IExchangeOracle.sol';

//lib
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';

library Power2Base {
  using SafeMath for uint256;

  uint32 private constant TWAP_PERIOD = 420 seconds;
  uint256 private constant INDEX_SCALE = 1e4;
  uint256 private constant ONE = 1e18;
  uint256 private constant ONE_ONE = 1e36;

  /**
   * @notice return the scaled down index of the power perp in USD, scaled by 18 decimals
   * @param _secondsAgo period of time for the twap in seconds (cannot be longer than maximum period for the pool)
   * @param _indexOracle oracle addresss
   * @return for squeeth, return ethPrice^2
   */
  function _getIndex(uint32 _secondsAgo, address _indexOracle) internal view returns (uint256) {
    return IPerpOracle(_indexOracle).getIndexTwap(_secondsAgo).div(ONE);
  }

  /**
   * @notice return the unscaled index of the power perp in USD, scaled by 18 decimals
   * @param _secondsAgo period of time for the twap in seconds (cannot be longer than maximum period for the pool)
   * @param _indexOracle oracle address
   * @return index price
   */
  function _getUnscaledIndex(
    uint32 _secondsAgo,
    address _indexOracle
  ) internal view returns (uint256) {
    uint256 indexPrice = _getScaledIndexTwap(_indexOracle, _secondsAgo);
    return indexPrice.div(ONE);
  }

  /**
   * @notice return the mark price of power perp in quoteCurrency, scaled by 18 decimals
   * @param _secondsAgo period of time for the twap in seconds (cannot be longer than maximum period for the pool)
   * @param _marketOracle oracle address
   * @param _perpStablecoinPool Perp / Stablecoin pool
   * @param _perp perp erc20 address
   * @param _stablecoin stablecoin erc20 address
   * @param _normalizationFactor current normalization factor
   * @return uint256 price of perp in terms of stablecoin
   */
  function _getDenormalizedMark(
    uint32 _secondsAgo,
    address _marketOracle,
    address _perpStablecoinPool,
    address _perp,
    address _stablecoin,
    uint256 _normalizationFactor
  ) internal view returns (uint256) {
    uint256 perpStablecoinPrice = _getMarkTwap(
      _marketOracle,
      _perpStablecoinPool,
      _perp,
      _stablecoin,
      _secondsAgo,
      false
    );

    return perpStablecoinPrice.div(_normalizationFactor);
  }

  /**
   * @notice get the fair collateral value for a _debtAmount of wSqueeth
   * @dev the actual amount liquidator can get should have a 10% bonus on top of this value.
   * @param _debtAmount wSqueeth amount paid by liquidator
   * @return returns value of debt in ETH
   */
  function _getDebtValueInStablecoin(uint256 _debtAmount) internal pure returns (uint256) {
    return _debtAmount.div(ONE);
  }

  /**
   * @notice request twap from our oracle, scaled down by INDEX_SCALE
   * @param _marketOracle oracle address
   * @param _pool uniswap v3 pool address
   * @param _base base currency. to get eth/usd price, eth is base token
   * @param _quote quote currency. to get eth/usd price, usd is the quote currency
   * @param _secondsAgo number of seconds in the past to start calculating time-weighted average.
   * @param _checkPeriod check that period is not longer than maximum period for the pool to prevent reverts
   * @return twap price scaled down by INDEX_SCALE
   */
  function _getScaledMarkTwap(
    address _marketOracle,
    address _pool,
    address _base,
    address _quote,
    uint32 _secondsAgo,
    bool _checkPeriod
  ) internal view returns (uint256) {
    uint256 twap = IExchangeOracle(_marketOracle).getTwap(
      _pool,
      _base,
      _quote,
      _secondsAgo,
      _checkPeriod
    );
    return twap.div(INDEX_SCALE);
  }

  /**
   * @notice request twap from our oracle
   * @dev this will revert if period is > max period for the pool
   * @param _marketOracle oracle address
   * @param _pool uniswap v3 pool address
   * @param _base base currency. to get eth/quoteCurrency price, eth is base token
   * @param _quote quote currency. to get eth/quoteCurrency price, quoteCurrency is the quote currency
   * @param _secondsAgo number of seconds in the past to start calculating time-weighted average
   * @param _checkPeriod check that period is not longer than maximum period for the pool to prevent reverts
   * @return human readable price. scaled by 1e18
   */
  function _getMarkTwap(
    address _marketOracle,
    address _pool,
    address _base,
    address _quote,
    uint32 _secondsAgo,
    bool _checkPeriod
  ) internal view returns (uint256) {
    // period reaching this point should be check, otherwise might revert
    return IExchangeOracle(_marketOracle).getTwap(_pool, _base, _quote, _secondsAgo, _checkPeriod);
  }

  /**
   * @notice request twap from our oracle, scaled down by INDEX_SCALE
   * @param _indexOracle oracle address
   * @param _secondsAgo number of seconds in the past to start calculating time-weighted average.
   * @return twap price scaled down by INDEX_SCALE
   */
  function _getScaledIndexTwap(
    address _indexOracle,
    uint32 _secondsAgo
  ) internal view returns (uint256) {
    uint256 twap = IPerpOracle(_indexOracle).getIndexTwap(_secondsAgo);
    return twap.div(INDEX_SCALE);
  }

  /**
   * @notice request twap from our oracle
   * @dev this will revert if period is > max period for the pool
   * @param _indexOracle oracle address
   * @param _secondsAgo number of seconds in the past to start calculating time-weighted average
   * @return human readable price. scaled by 1e18
   */
  function _getIndexTwap(address _indexOracle, uint32 _secondsAgo) internal view returns (uint256) {
    // period reaching this point should be check, otherwise might revert
    return IPerpOracle(_indexOracle).getIndexTwap(_secondsAgo);
  }

  /**
   * @notice get the index value of wsqueeth in wei, used when system settles
   * @dev the index of squeeth is ethPrice^2, so each squeeth will need to pay out {ethPrice} eth
   * @param _longPerpAmount amount of wsqueeth used in settlement
   * @param _indexPriceForSettlement index price for settlement
   * @param _normalizationFactor current normalization factor
   * @return amount in wei that should be paid to the token holder
   */
  function _getLongSettlementValue(
    uint256 _longPerpAmount,
    uint256 _indexPriceForSettlement,
    uint256 _normalizationFactor
  ) internal pure returns (uint256) {
    return _longPerpAmount.mul(_normalizationFactor).mul(_indexPriceForSettlement).div(ONE_ONE);
  }
}
