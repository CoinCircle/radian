## Radian

## Overview
Radian will collect significant holdings of tokens deployed and issued from the
CoinCircle platform. Holders of the Radian token (RAD) will be able to liquidate
their RAD into the smart contract and receive a fractional percentage of
individual tokens that the Radian smart contract was holding. The liquidation of
RAD effectively burns those specific tokens.

In order to receive the tokens, a holder must interact with the CoinCircle
platform so that there is an AML/KYC check that occurs on each participant. This
participant will be added to a CoinCircle whitelist that lives on the
blockchain. The whitelist is checked every time the receipt of tokens occurs.

It is possible for random tokens to be sent to the Radian smart contract.
CoinCircle offers two solutions in order to avoid any issues related to this. A
user must transact with the Radian smart contract through the CoinCircle
platform, thus giving CoinCircle the ability to direct what tokens are received
upon a liquidation event. In the event that there is a malicious/illegal token
added to the Radian smart contract, there will be a token removal function that
removes a specified token from the smart contract.

Users will receive the same percentage of each token in the Radian smart
contract upon liquidation of RAD. This number will be calculated by taking
the number of RAD being contributed and dividing it by the total RAD in
existence at the given time.

<p align="center">
  <img alt="percentage equation" src="https://latex.codecogs.com/gif.latex?%5C%25Tokens%20Received%20%3D%20%5Cfrac%7BRAD_%7Bcontributed%7D%7D%7BRAD_%7Btotalsupply%7D%7D" />
</p>

All price calculations will be calculated on-chain by the smart contract as a
function of the remaining number of RAD in circulation. Each liquidation
transaction sent to the smart contract will include an array of contract
addresses for each of the tokens to be collected. This must be done off-chain so
that a user does not get their wallet filled with spam-tokens that have entered
the Radian smart contract unintentionally.

The contract will neither have nor need to price of tokens in USD at any point.
Liquidation always takes a percentage of tokens that is equivalent to the
percentage of RAD that are being contributed relative to the total supply at the
time. The smart contract only needs to know the ratio of the total number of RAD
to the number of RAD being contributed.

The token distribution contracts of the customers will automatically dispense
their tokens into the Radian smart contract during the creation of the tokens.

## Token Redemption

### Distribution Equation Explanation

The contract performs logic to calculate the number of tokens receivable by each
liquidator. A liquidator will receive each token proportionate to the ratio of 
his RAD contribution for that particular transaction. The calculation below
shows the exact number of tokens that a liquidator will recieve:

<p align="center">
  <img alt="percentage equation" src="https://latex.codecogs.com/gif.latex?NumTokenReceived%20%3D%20FLOOR%20%5Cleft%20%28%5Cleft%20%28%20%5Cfrac%7BRAD_%7Bcontributed%7D%7D%7BRAD_%7BtotalSupply%7D%7D%20%5Cright%20%29%20*%20NumTokenInRadian%20%5Cright%20%29" />
</p>


The `FLOOR` function above accounts for the fact that `uint` calculations
truncate digits after the decimal.

In an extreme case, a liquidator will contribute only 1 RAD token (as opposed to 
1E18). With all other variable being standard, this will result in 0 of this 
specific token returned to the liquidator.

In order tor receive a specific token, the RAD contribution must be above a
certain number that generates a >1 return. The formula below guarantees a payout
in a specific token from the liquidation event:

<p align="center">
  <img alt="percentage equation" src="https://latex.codecogs.com/gif.latex?1%20%3C%20%5Cleft%20%28%20%5Cfrac%7BRAD_%7Bcontributed%7D%7D%7BRAD_%7BtotalSupply%7D%7D%20%5Cright%20%29%20*%20NumTokenInRadian" />
</p>

### Client Integration
Users will be able to access the redemption function through the CoinCircle
platform and will be able to execute the action with a simple click of a button.

On the backend, there are two transactions that will occur the first time a 
person attempts to redeem their tokens: the approval transaction and the 
redemption transaction. 

The approval transaction is a byproduct of using the ERC-20 standard. It allows
someone to transfer tokens on behalf of a user. On the CoinCircle platform, a 
user will attempt to execute the redeem function, but will first go through the
approval process. Their account on the CoinCircle platform will be approved for
the maximum number of RAD tokens able to be transferred. By doing this up front,
a user will be able to bypass this step on every subsequent redemption.

Following the approval, the backend will call the redeem function that will 
execute the function that gives them their tokens.

## Governance
Radian can be used as a governance token that allows its holders to vote on
various features throughout the CoinCircle platform and Radian protocol.

A new contract will be deployed for each vote, each with the same functionality.
A proposition will be posted with any number *n* options to choose from. Holders
of radian will send their RAD into the contract in order to secure their vote, 
choosing their preferred option during the same transaction. At the end of the
specified time period, the option with the greatest number of RAD associated
with it will be the winning vote, and that option may be implemented in the 
future.

There will be a minimum voting threshold that must be hit in order for the vote
to be valid. If the threshold is not hit, a default option will be chosen.
