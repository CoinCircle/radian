// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPerpOracle {
    /// @notice Returns the index price now
    function getIndexPrice() external view returns (uint256);

    /// @notice returns the time-weighted average index price since the given timestamp
    /// @param _secondsAgo the number of seconds in the past to start the time-weighted average
    /// @return int256 time-weighted average index price
    /// @dev if maxComplexity is reached, the returned timestamp will be the timestamp of the last data point used in the calculation
    function getIndexTwap(
      uint32 _secondsAgo
    ) external view returns(uint256);
}

// in the above interface, the delta between the current funding rate
// and the time-weighted average funding rate is the factory by which the
// mark price is adjusted


/// Formula
/// Given lastUpdatedAt = 0
/// Given history(t,v) = [ [1, 0], [2, -1], [4, 0]]
/// Transform to (1 * 0) + (2 * -1) + (4 * 0) = -2, then divide by 4
/// return -2 / 4 = -0.5
/// set lastUpdatedAt = 4