// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import './pool/IExchangePoolImmutables.sol';
import './pool/IExchangePoolState.sol';
import './pool/IExchangePoolDerivedState.sol';
import './pool/IExchangePoolActions.sol';
import './pool/IExchangePoolOwnerActions.sol';
import './pool/IExchangePoolEvents.sol';

/// @title The interface for a Uniswap V3 Pool
/// @notice A Uniswap pool facilitates swapping and automated market making between any two assets that strictly conform
/// to the ERC20 specification
/// @dev The pool interface is broken up into many smaller pieces
interface IExchangePool is
    IExchangePoolImmutables,
    IExchangePoolState,
    IExchangePoolDerivedState,
    IExchangePoolActions,
    IExchangePoolOwnerActions,
    IExchangePoolEvents
{

}