pragma solidity ^0.8.0;

interface ICurve {
  function getPoint(uint x) external view returns (uint256);
}
