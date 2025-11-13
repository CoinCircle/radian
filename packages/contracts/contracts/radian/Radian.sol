pragma solidity ^0.8.0;

abstract contract Radian {
  // ===========================================================================
  // State
  // ===========================================================================

  /// @notice Extra-Terrestrial Stablecoin Max - The maximum amount of
  /// stablecoin that can exist outside of the protocol
  uint256 public etStablecoinAmountMax;

  //// @notice The amount of stablecoin that crrently exists off-planet
  /// (outside of the protocol).
  uint256 public etStablecoinAmount;
}
