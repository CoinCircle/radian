pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract TestToken is StandardToken {
  using SafeMath for uint;

  string public constant name = 'Test';
  string public constant symbol = 'TST';
  uint8 public constant decimals = 18;
  string public version = '0.1';

  uint256 public constant EXP_18 = 18;
  event CreateTST(address indexed _to, uint256 _value);

  function TestToken(address _radian, uint256 _amount) {
    require(_radian != 0);
    totalSupply_ = _amount;

    balances[_radian] = totalSupply_;
    Transfer(0x0, _radian, totalSupply_);
    CreateTST(_radian, totalSupply_);
  }
}
