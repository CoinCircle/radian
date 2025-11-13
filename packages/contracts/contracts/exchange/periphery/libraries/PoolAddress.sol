// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

library L2ContractHelper {
  bytes32 constant CREATE2_PREFIX = keccak256('zksyncCreate2');

  function computeCreate2Address(
    address _sender,
    bytes32 _salt,
    bytes32 _bytecodeHash,
    bytes32 _constructorInputHash
  ) internal pure returns (address) {
    bytes32 senderBytes = bytes32(uint256(uint160(_sender)));
    bytes32 data = keccak256(
      bytes.concat(CREATE2_PREFIX, senderBytes, _salt, _bytecodeHash, _constructorInputHash)
    );

    return address(uint160(uint256(data)));
  }
}

/// @title Provides functions for deriving a pool address from the factory, tokens, and the fee
library PoolAddress {
  // bytes32 internal constant POOL_INIT_CODE_HASH = 0x8347735a8e1878760bb020647a03785090e8e995ca3a4278f34ff29be8c896cf;
  bytes32 internal constant POOL_INIT_CODE_HASH =
    0x01000eff4bc484579bc761c156e3e1ad6f17573a52a6cfa05ffd15d74f2fd219;

  /// @notice The identifying key of the pool
  struct PoolKey {
    address token0;
    address token1;
    uint24 fee;
  }

  /// @notice Returns PoolKey: the ordered tokens with the matched fee levels
  /// @param tokenA The first token of a pool, unsorted
  /// @param tokenB The second token of a pool, unsorted
  /// @param fee The fee level of the pool
  /// @return Poolkey The pool details with ordered token0 and token1 assignments
  function getPoolKey(
    address tokenA,
    address tokenB,
    uint24 fee
  ) internal pure returns (PoolKey memory) {
    if (tokenA > tokenB) (tokenA, tokenB) = (tokenB, tokenA);
    return PoolKey({token0: tokenA, token1: tokenB, fee: fee});
  }

  /// @notice Deterministically computes the pool address given the factory and PoolKey
  /// @param factory The Uniswap V3 factory contract address
  /// @param key The PoolKey
  /// @return pool The contract address of the V3 pool
  function computeAddress(
    address factory,
    PoolKey memory key
  ) internal pure returns (address pool) {
    require(key.token0 < key.token1);
    pool = L2ContractHelper.computeCreate2Address(
      factory,
      keccak256(abi.encode(key.token0, key.token1, key.fee)),
      POOL_INIT_CODE_HASH,
      keccak256('')
    );
  }

  function computeAddressExternal(
    address factory,
    address token0,
    address token1,
    uint24 fee
  ) public pure returns (address pool) {
    require(token0 < token1);
    // keccak256(bytes.concat(CREATE_PREFIX, bytes32(uint256(uint160(_sender))), bytes32(_senderNonce)));
    pool = L2ContractHelper.computeCreate2Address(
      factory,
      keccak256(abi.encodePacked(token0, token1, fee)),
      POOL_INIT_CODE_HASH,
      keccak256('')
    );
  }
}
