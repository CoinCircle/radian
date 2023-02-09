pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../lib/strings.sol";

interface Transferrable {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract Collector is
  Initializable,
  OwnableUpgradeable,
  UUPSUpgradeable
{
  using SafeMath for uint256;
  using strings for *;

  // Map addresses of assets addresses to their approved state
  // of whether they are considered as part of the collector
  mapping (address => bool) public isCollectableByAddress;

  // Array of addresses collectable
  address[] collectingAddresses;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  function initialize() initializer public {
      __Ownable_init();
      __UUPSUpgradeable_init();
  }

  function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

  function _addCollectableAddress(address _collectableAddress) internal onlyOwner {
      require(isCollectableByAddress[_collectableAddress] == false, "Address already added");
      isCollectableByAddress[_collectableAddress] = true;
      collectingAddresses.push(_collectableAddress);
  }

  function _removeColectableAddress(address _addr) internal onlyOwner {
      require(isCollectableByAddress[_addr] == true, "Address not added");
      isCollectableByAddress[_addr] = false;
      uint index = 0;
      for (uint i = 0; i < collectingAddresses.length; i++) {
          if (collectingAddresses[i] == _addr) {
              index = i;
              break;
          }
      }
      if (collectingAddresses.length > 1) {
          // replace item at index with last item
          collectingAddresses[index] = collectingAddresses[collectingAddresses.length-1];
      }
      collectingAddresses.pop();
  }

  // to be called by radian contact multiple times
  // Radian contract is responsible for calculating proper amounts and validating
  function withdraw(address _assetAddress, address _to, uint256 _amount) external onlyOwner {
    require(isCollectableByAddress[_assetAddress] == true, "Address not added");
    Transferrable asset = Transferrable(_assetAddress);
    asset.transfer(_to, _amount);
  }

  function executeTransaction(address to, uint256 value, uint256 gasLimit, bytes memory data)
    external
    onlyOwner
    returns (bytes memory)
{
      return _executeTransaction(to, value, gasLimit, data);
  }


    /// @notice This is the transaction sent from the CBA
    /// @param _to To address of the transaction
    /// @param _value Value of the transaction
    /// @param _gasLimit Gas limit of the transaction
    /// @param _data Data of the transaction
    /// @return Response of the call
    function _executeTransaction(
        address _to,
        uint256 _value,
        uint256 _gasLimit,
        bytes memory _data
    )
        internal
        returns (bytes memory)
    {
        (bool success, bytes memory res) = _to.call{gas: _gasLimit, value: _value}(_data);

        // Get the revert message of the call and revert with it if the call failed
        if (!success) {
            revert(_getPrefixedRevertMsg(res));
        }

        return res;
    }

    /// @dev Get the revert message from a call
    /// @notice This is needed in order to get the human-readable revert message from a call
    /// @param _res Response of the call
    /// @return Revert message string
    function _getRevertMsgFromRes(bytes memory _res) internal pure returns (string memory) {
        // If the _res length is less than 68, then the transaction failed silently (without a revert message)
        if (_res.length < 68) return 'Collector: Transaction reverted silently';
         assembly {
            // Slice the sighash.
            _res := add(_res, 0x04)  // Remove the selector which is the first 4 bytes
        }
        return abi.decode(_res, (string)); // All that remains is the revert string
    }

    /// @dev Get the prefixed revert message from a call
    /// @param _res Response of the call
    /// @return Prefixed revert message string
    function _getPrefixedRevertMsg(bytes memory _res) internal pure returns (string memory) {
        string memory _revertMsg = _getRevertMsgFromRes(_res);
        return string(abi.encodePacked("Radian Collector Revert: ", _revertMsg));
    }
}