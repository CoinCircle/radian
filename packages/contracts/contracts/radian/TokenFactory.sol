pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';

/**
 * @title Token is a basic ERC20 Token
 */
contract Token is ERC20, ERC20PresetFixedSupply, Ownable {
  uint8 _decimals = 18;

  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    uint8 _decimals_,
    address _owner
  ) ERC20PresetFixedSupply(_name, _symbol, _totalSupply, _owner) {
    _decimals = _decimals_;
  }

  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  // TODO: add a function to mint tokens
}

contract TokenFactory {
  error InsufficientFee();
  using SafeERC20 for Token;
  using SafeMath for uint256;

  event TokenCreated(
    address indexed owner,
    address indexed token,
    string name,
    string symbol,
    uint256 totalSupply
  );

  Token[] tokens; // list of all created tokens
  mapping(address => Token[]) ownedTokens; // created tokens by owner address

  address private owner; // token factory admin
  address public feeWallet; // address to collect token creation fees
  address public collector; // address of the collector contract
  uint256 public collectorSharePercentage = 5; // percent of tokens to be distributed to the collector
  uint256 public fee = 100000000000000000; // token creation fee in WEI (default 0.1 ETH)

  constructor() {
    owner = msg.sender;
    feeWallet = msg.sender;
    collector = msg.sender;
  }

  // restrict calls to specified address
  modifier onlyBy(address _account) {
    require(msg.sender == _account);
    _;
  }

  // restrict collector share range
  function isValidPercent(uint256 _percent) internal pure returns (bool) {
    if (_percent > 100) return false;
    if (_percent < 0) return false;
    return true;
  }

  // check if current address is the contract owner
  function isOwner() public view returns (bool) {
    return msg.sender == owner;
  }

  // transfer ownership
  function setOwner(address _newOwner) public onlyBy(owner) {
    owner = _newOwner;
  }

  // update fee wallet address
  function setFeeWallet(address payable _newFeeWallet) public onlyBy(owner) {
    feeWallet = _newFeeWallet;
  }

  // update collector contract address
  function setCollector(address _newCollector) public onlyBy(owner) {
    collector = _newCollector;
  }

  // update collector share of created tokens (percentage between 0 - 100)
  function setCollectorSharePercentage(uint256 _collectorSharePercentage) public onlyBy(owner) {
    require(isValidPercent(_collectorSharePercentage));
    collectorSharePercentage = _collectorSharePercentage;
  }

  // update the token creation fee (amount in WEI)
  function setFee(uint256 _fee) public onlyBy(owner) {
    fee = _fee;
  }

  // get tokens owned by the current address
  function getOwnedTokens() public view returns (Token[] memory) {
    return ownedTokens[msg.sender];
  }

  // creates new token contract
  // collects token creation fee
  // stores references to the created contract
  // distributes tokens between the creator and the collector (according to collector share)
  // transfers ownership to the creator
  function generateToken(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    uint8 _decimals
  ) public payable {
    // require fee payment
    if (msg.value < fee) revert InsufficientFee();

    // create token contract
    Token token = new Token(_name, _symbol, _totalSupply, _decimals, address(this));
    tokens.push(token);
    ownedTokens[msg.sender].push(token);

    // calculate distributions
    uint256 collectorShare = _totalSupply.mul(collectorSharePercentage).div(100);
    uint256 ownerShare = _totalSupply.sub(collectorShare);

    // distribute tokens
    token.safeTransfer(collector, collectorShare);
    token.safeTransfer(msg.sender, ownerShare);

    // transfer ownership
    token.transferOwnership(msg.sender);

    // transfer creation fee to feeWallet
    payable(feeWallet).call{value: msg.value}('');

    emit TokenCreated(msg.sender, address(token), _name, _symbol, _totalSupply);
  }
}
