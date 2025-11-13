pragma solidity ^0.8.0;

import {ERC4626} from 'solmate/src/mixins/ERC4626.sol';

// IMoneyMarketLockable is an extension of IMoneyMarket. Supply in the lockable
// market is used to fund leveraged trades, and can therefore be locked if it
// is being used in a trade.
abstract contract IMoneyMarketLockable is ERC4626 {}
