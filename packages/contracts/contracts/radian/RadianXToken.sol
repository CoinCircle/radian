// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ERC20Burnable} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import {Pausable} from '@openzeppelin/contracts/security/Pausable.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ERC20Permit} from '@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol';
import {ERC20Votes} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol';
import {ERC20FlashMint} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol';

// Radian custom, adds meta-transaction support.
import {EIP712} from '../lib/EIP712.sol';

contract RadianX is
  ERC20,
  ERC20Burnable,
  Pausable,
  Ownable,
  ERC20Permit,
  ERC20Votes,
  ERC20FlashMint
{
  constructor() ERC20('RadianX', 'RADX') ERC20Permit('RadianX') {
    _mint(msg.sender, 15000000 * 10 ** decimals());
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }

  // The following functions are overrides required by Solidity.

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20, ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }

  function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
    super._burn(account, amount);
  }

  // =========================================================================
  // EIP3009 Support (Copied from USDC)
  // =========================================================================

  /**
   * @notice Execute a transfer with a signed authorization
   * @param from          Payer's address (Authorizer)
   * @param to            Payee's address
   * @param value         Amount to be transferred
   * @param validAfter    The time after which this is valid (unix time)
   * @param validBefore   The time before which this is valid (unix time)
   * @param nonce         Unique nonce
   * @param v             v of the signature
   * @param r             r of the signature
   * @param s             s of the signature
   */
  function transferWithAuthorization(
    address from,
    address to,
    uint256 value,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external whenNotPaused {
    _transferWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s);
  }

  /**
   * @notice Receive a transfer with a signed authorization from the payer
   * @dev This has an additional check to ensure that the payee's address
   * matches the caller of this function to prevent front-running attacks.
   * @param from          Payer's address (Authorizer)
   * @param to            Payee's address
   * @param value         Amount to be transferred
   * @param validAfter    The time after which this is valid (unix time)
   * @param validBefore   The time before which this is valid (unix time)
   * @param nonce         Unique nonce
   * @param v             v of the signature
   * @param r             r of the signature
   * @param s             s of the signature
   */
  function receiveWithAuthorization(
    address from,
    address to,
    uint256 value,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external whenNotPaused {
    _receiveWithAuthorization(from, to, value, validAfter, validBefore, nonce, v, r, s);
  }

  /**
   * @notice Attempt to cancel an authorization
   * @dev Works only if the authorization is not yet used.
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   * @param v             v of the signature
   * @param r             r of the signature
   * @param s             s of the signature
   */
  function cancelAuthorization(
    address authorizer,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external whenNotPaused {
    _cancelAuthorization(authorizer, nonce, v, r, s);
  }

  // keccak256("TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
  bytes32 public constant TRANSFER_WITH_AUTHORIZATION_TYPEHASH =
    0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267;

  // keccak256("ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)")
  bytes32 public constant RECEIVE_WITH_AUTHORIZATION_TYPEHASH =
    0xd099cc98ef71107a616c4f0f941f04c322d8e254fe26b3c6668db87aae413de8;

  // keccak256("CancelAuthorization(address authorizer,bytes32 nonce)")
  bytes32 public constant CANCEL_AUTHORIZATION_TYPEHASH =
    0x158b0a9edf7a828aad02f63cd515c68ef2f50ba807396f6d12842833a1597429;

  /**
   * @dev authorizer address => nonce => bool (true if nonce is used)
   */
  mapping(address => mapping(bytes32 => bool)) private _authorizationStates;

  event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
  event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);

  /**
   * @notice Returns the state of an authorization
   * @dev Nonces are randomly generated 32-byte data unique to the
   * authorizer's address
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   * @return True if the nonce is used
   */
  function authorizationState(address authorizer, bytes32 nonce) external view returns (bool) {
    return _authorizationStates[authorizer][nonce];
  }

  /**
   * @notice Execute a transfer with a signed authorization
   * @param from          Payer's address (Authorizer)
   * @param to            Payee's address
   * @param value         Amount to be transferred
   * @param validAfter    The time after which this is valid (unix time)
   * @param validBefore   The time before which this is valid (unix time)
   * @param nonce         Unique nonce
   * @param v             v of the signature
   * @param r             r of the signature
   * @param s             s of the signature
   */
  function _transferWithAuthorization(
    address from,
    address to,
    uint256 value,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    _requireValidAuthorization(from, nonce, validAfter, validBefore);

    bytes memory data = abi.encode(
      TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
      from,
      to,
      value,
      validAfter,
      validBefore,
      nonce
    );
    require(
      EIP712.recover(_domainSeparatorV4(), v, r, s, data) == from,
      'FiatTokenV2: invalid signature'
    );

    _markAuthorizationAsUsed(from, nonce);
    _transfer(from, to, value);
  }

  /**
   * @notice Receive a transfer with a signed authorization from the payer
   * @dev This has an additional check to ensure that the payee's address
   * matches the caller of this function to prevent front-running attacks.
   * @param from          Payer's address (Authorizer)
   * @param to            Payee's address
   * @param value         Amount to be transferred
   * @param validAfter    The time after which this is valid (unix time)
   * @param validBefore   The time before which this is valid (unix time)
   * @param nonce         Unique nonce
   * @param v             v of the signature
   * @param r             r of the signature
   * @param s             s of the signature
   */
  function _receiveWithAuthorization(
    address from,
    address to,
    uint256 value,
    uint256 validAfter,
    uint256 validBefore,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    require(to == msg.sender, 'FiatTokenV2: caller must be the payee');
    _requireValidAuthorization(from, nonce, validAfter, validBefore);

    bytes memory data = abi.encode(
      RECEIVE_WITH_AUTHORIZATION_TYPEHASH,
      from,
      to,
      value,
      validAfter,
      validBefore,
      nonce
    );
    require(
      EIP712.recover(_domainSeparatorV4(), v, r, s, data) == from,
      'FiatTokenV2: invalid signature'
    );

    _markAuthorizationAsUsed(from, nonce);
    _transfer(from, to, value);
  }

  /**
   * @notice Attempt to cancel an authorization
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   * @param v             v of the signature
   * @param r             r of the signature
   * @param s             s of the signature
   */
  function _cancelAuthorization(
    address authorizer,
    bytes32 nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    _requireUnusedAuthorization(authorizer, nonce);

    bytes memory data = abi.encode(CANCEL_AUTHORIZATION_TYPEHASH, authorizer, nonce);
    require(
      EIP712.recover(_domainSeparatorV4(), v, r, s, data) == authorizer,
      'FiatTokenV2: invalid signature'
    );

    _authorizationStates[authorizer][nonce] = true;
    emit AuthorizationCanceled(authorizer, nonce);
  }

  /**
   * @notice Check that an authorization is unused
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   */
  function _requireUnusedAuthorization(address authorizer, bytes32 nonce) private view {
    require(
      !_authorizationStates[authorizer][nonce],
      'FiatTokenV2: authorization is used or canceled'
    );
  }

  /**
   * @notice Check that authorization is valid
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   * @param validAfter    The time after which this is valid (unix time)
   * @param validBefore   The time before which this is valid (unix time)
   */
  function _requireValidAuthorization(
    address authorizer,
    bytes32 nonce,
    uint256 validAfter,
    uint256 validBefore
  ) private view {
    require(block.timestamp > validAfter, 'FiatTokenV2: authorization is not yet valid');
    require(block.timestamp < validBefore, 'FiatTokenV2: authorization is expired');
    _requireUnusedAuthorization(authorizer, nonce);
  }

  /**
   * @notice Mark an authorization as used
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   */
  function _markAuthorizationAsUsed(address authorizer, bytes32 nonce) private {
    _authorizationStates[authorizer][nonce] = true;
    emit AuthorizationUsed(authorizer, nonce);
  }
}
