pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract RAD is BurnableToken, StandardToken {
  using SafeMath for uint;

  string public constant name = 'Radian';
  string public constant symbol = 'RAD';
  uint8 public constant decimals = 18;
  string public version = '0.1';

  uint256 public constant EXP_18 = 18;
  uint256 public constant CC_ALLOCATION = 750 * (10 ** 6) * 10 ** EXP_18; // 750 million tokens created for CC
  uint256 public constant COMMUNITY_ALLOCATION = 250 * (10 ** 6) * 10 ** EXP_18; // 250 million tokens created for Community
  event CreateRAD(address indexed _to, uint256 _value);

  function RAD(address _ccSupply, address _communitySupply) {
    require(_ccSupply != 0);
    require(_communitySupply != 0);
    totalSupply_ = CC_ALLOCATION.add(COMMUNITY_ALLOCATION);

    balances[_ccSupply] = CC_ALLOCATION;
    Transfer(0x0, _ccSupply, CC_ALLOCATION);
    CreateRAD(_ccSupply, CC_ALLOCATION);

    balances[_communitySupply] = COMMUNITY_ALLOCATION;
    Transfer(0x0, _communitySupply, COMMUNITY_ALLOCATION);
    CreateRAD(_communitySupply, COMMUNITY_ALLOCATION);
  }
}
