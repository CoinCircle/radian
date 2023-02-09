---
sidebar_position: 0
---

# Overview

Strategies are a category of peripheral modules that allow users to create
custom vaults that execute unique DeFi strategies. As an end-to-end DeFi ecosystem
Radian contains all the necessary building blocks to enable theses strategies.

Through Radian's Governance, users can create and vote on new strategies.

Below we describe the currently available strategies and their respective
implementation details.

## Levered stETH

The levered stETH strategy is a leveraged staking strategy that allows users to
deposit ETH and receive a leveraged stETH position. This is equivalent to staking
ETH as a validator, without the need to run a validator node or the 32 ETH minimum,
while providing better returns than staking ETH directly.

At a high level, the levered stETH strategy works as follows, assuming a 2x leverage
against a 10 ETH deposit when ETH is trading at $1000:

1. You deposit 10 ETH ($10,000)
2. The strategy flash borrows 10,000 USD+ from the Radian Money Market.
  * balance = 10,000 USD+ + 10 ETH
  * flash debt = 10,000 USD+
3. The strategy swaps 10,000 USD+ for 10 ETH on the Radian USD+:ETH exchange pool.
  * balance = 20 ETH
  * flash debt = 10,000 USD+
4. The strategy mints 20 stETH tokens using the 20 ETH it now has.
  * balance = 20 stETH ($20,000)
  * flash debt = 10,000 USD+
5. The strategy deposits the 20 stETH tokens into the Radian money market.
  * balance = 0
  * flash debt = 10,000 USD+
  * money market collateral = 20 stETH ($20,000)
6. The strategy borrows 10,000 USD+ from the Radian money market.
  * balance = 10,000 USD+
  * flash debt = 10,000 USD+
  * money market collateral = 20 stETH ($20,000)
  * money market debt = 10,000 USD+
7. The strategy repays the flash loan.
  * balance = 10,000 USD+
  * flash debt = 0
  * money market collateral = 20 stETH ($20,000)
  * money market debt = 10,000 USD+


## Levered Liquidity Provisioning

The levered liquidity provisioning strategy is a leveraged liquidity provision
strategy that allows users to deposit ETH and receive a leveraged LP position.
This is equivalent to providing liquidity to a Uniswap pool, in such a manner that
you are able to provide more liquidity than you have deposited. There is a risk
here when using volatile assets, and therefore this strateg is only recommended
for stablecoins.

At a high level, the levered liquidity provisioning strategy works as follows,
assuming a 2x leverage against a 10 ETH deposit when ETH is trading at $1000:

1. You deposit 10 ETH ($10,000)
2. The strategy flash borrows 10,000 USD+ from the Radian Money Market.
  * balance = 10,000 USD+ + 10 ETH
  * flash debt = 10,000 USD+
3. The strategy swaps 10,000 USD+ for 10 ETH on the Radian USD+:ETH exchange pool.
  * balance = 20 ETH
  * flash debt = 10,000 USD+
4. The strategy provides liquidity to the Radian USD+:ETH exchange pool.
  * balance = 0
  * flash debt = 10,000 USD+
  * exchange pool liquidity = 20 ETH
5. The strategy borrows 10,000 USD+ from the Radian money market.
  * balance = 10,000 USD+
  * flash debt = 10,000 USD+
  * exchange pool liquidity = 20 ETH
  * money market debt = 10,000 USD+
6. The strategy repays the flash loan.
  * balance = 10,000 USD+
  * flash debt = 0
  * exchange pool liquidity = 20 ETH
  * money market debt = 10,000 USD+
