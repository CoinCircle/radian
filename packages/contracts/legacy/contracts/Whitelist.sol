pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Whitelist is Ownable {
  // Mapping
  mapping(address => bool) public isVerifiedByAddress;
  mapping(address => bool) public isAccreditedByAddress;

  // Events
  event VerificationChanged(address indexed target, bool indexed isRegistered);
  event AccreditationChanged(address indexed target, bool indexed isRegistered);

  /// @dev Adds a user to the list of registered KYC users
  /// @param targetUser User whose KYC status will be changed
  /// @param isRegistered New registration status of the address
  function setVerified(address targetUser, bool isRegistered) public onlyOwner {
    isVerifiedByAddress[targetUser] = isRegistered;
    VerificationChanged(targetUser, isRegistered);
  }

  /// @dev Adds users to the list of registered KYC users
  /// @param targetUsers Array of users whose KYC status will be changed
  /// @param isRegistered New registration status of addresses
  function setVerifiedMultiple(address[] targetUsers, bool isRegistered) public onlyOwner {
    for (uint256 i = 0; i < targetUsers.length; i++) {
      setVerified(targetUsers[i], isRegistered);
    }
  }

  /// @dev Adds a user to the list of registered AML users
  /// @param targetUser User whose AML status will be changed
  /// @param isRegistered New registration status of the address
  function setAccredited(address targetUser, bool isRegistered) public onlyOwner {
    isAccreditedByAddress[targetUser] = isRegistered;
    AccreditationChanged(targetUser, isRegistered);
  }

  /// @dev Adds users to the list of registered AML users
  /// @param targetUsers Array of users whose AML status will be changed
  /// @param isRegistered New registration status of addresses
  function setAccreditedMultiple(address[] targetUsers, bool isRegistered) public onlyOwner {
    for (uint256 i = 0; i < targetUsers.length; i++) {
      setAccredited(targetUsers[i], isRegistered);
    }
  }

  /// @dev Change both KYC and AML status for a user
  /// @param targetUser User whose KYC and AML statuses will be changed
  /// @param isRegistered New registration status of address
  function setVerifiedAndAccredited(address targetUser, bool isRegistered) public onlyOwner {
    setVerified(targetUser, isRegistered);
    setAccredited(targetUser, isRegistered);
  }

  /// @dev Change both KYC and AML status for multiple users
  /// @param targetUsers Array of users whose KYC and AML statuses will be changed
  /// @param isRegistered New registration status of addresses
  function setVerifiedAndAccreditedMultiple(
    address[] targetUsers,
    bool isRegistered
  ) public onlyOwner {
    for (uint256 i = 0; i < targetUsers.length; i++) {
      setVerified(targetUsers[i], isRegistered);
      setAccredited(targetUsers[i], isRegistered);
    }
  }

  /// @dev Swap the address of an existing user
  /// @param oldAddress Old address that will be swapped
  /// @param newAddress New address that will be swapped
  function swapAddress(address oldAddress, address newAddress) public onlyOwner {
    if (isVerifiedByAddress[oldAddress]) {
      setVerified(oldAddress, false);
      setVerified(newAddress, true);
    }

    if (isAccreditedByAddress[oldAddress]) {
      setAccredited(oldAddress, false);
      setAccredited(newAddress, true);
    }
  }

  /// @dev Swap the address of an existing users
  /// @param oldAddresses Old addresses that will be swapped
  /// @param newAddresses New addresses that will be swapped
  function swapAddresses(address[] oldAddresses, address[] newAddresses) public onlyOwner {
    require(oldAddresses.length == newAddresses.length);

    for (uint256 i = 0; i < oldAddresses.length; i++) {
      swapAddress(oldAddresses[i], newAddresses[i]);
    }
  }
}
