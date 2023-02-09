---
sidebar_position: 1
---

# Overview

Radian allows you to create synthetic derivatives based on any value so long
as it can be represented as a number in a smart contract.

At a high-level: synthetic derivatives in Radian work much like perpetual contracts
commonly seen on centralized crypto exchanges where one side (e.g. longs) pays
a continual funding rate to the other side (e.g. shorts) based on the long-short ratio.

However, the description above is not practical on-chain due to the fact that it
would require too many on-chain transactions. Instead, Radian uses a different
model where the funding rate is instead represented in the change of the price
itself. Synthetic derivatives on Radian are inspired by the [power perpetuals](https://www.paradigm.xyz/2021/08/power-perpetuals)
paper by Paradigm. The main difference is that Radian generalizes the concept
to allow for any value to be represented as a synthetic derivative, rather than
just the power of a price of an asset.

## Creating Derivatives

The heart of a synthetic derivative lies in the index price. To create a derivative,
you can implement a smart contract that exposes an `indexPrice` function which
determines the index price of the derivative. This means you can make a derivative
that tracks not just prices, but anything with a numerical value, so long as
it can be computed on-chain. Once you have created your index price contract,
you can deploy a derivative contract using the `DerivativeFactory` contract,
and pass in the address of your index price contract, as well as the funding rate
which we will discuss next.

## Funding Rate

The funding rate determines the fee which is paid over time from longs to shorts.
Unlike in perpetual contracts where the side which pays the fee can change, in
Radian the funding rate is always paid from longs to shorts (with some exceptions). This means
that the short side always earns a constant fee.

The funding rate is also a function that will be implemented in your contract and
is therefore dynamic. This feature is a key part of the protocol as it allows
previously impractical derivatives to become practical. For example, if you
wanted to create a derivative that tracks the temperature of Los Angeles, a constant
funding rate would not be practical because the temperature of a city is somewhat
predictable, and therefore the incentive for shorts would be low in January (the
coldest month in Los Angeles), and high in July (the hottest month in Los Angeles).
Therefore the funding rate should be very high in January, and very low (or even negative) in July .

Another important to keep in mind when designing the funding rate is to design it such
that it accounts for the volatility of the underlying index price. If the
volatility is high, then the risk-adjusted return for the short side will be
lower, and thus the funding rate should be higher.

To summarize, the funding rate exists purely as an economic incentive for the
short side to maintain the derivative, as the short side is the side taking the
most risk, and the funding rate should be proportional to the risk-adjusted return
of the short side.

## Minting Liquidity

Also unlike traditional perpetual contracts, in Radian, only the short side can
be liquidated. This means that the long side can never be liquidated, and thus
the long side can never be forced to exit the position. Also, the short side
initiates the creation of liquidity, which means that the short side must put up
collateral in order to mint liquidity.

## Market Price

Since it would not be practical to have every long position pay some fee via an
on-chain transaction on some time interval, Radian instead applies a normalization factor
to the index price of the derivative in order to derive the market price. The
market price is the price paid to buy or sell the derivative directly to the
contract. This mechanic is similar to the exchange rate in lending markets such as
compound, where the exchange rate of cDAI to DAI is always increasing according
to the interest rate.

For example in Compound, when you supply DAI, you receive cDAI at some exchange
rate, for example 1.0 cDAI per DAI. If the interest rate is 12%, then the exchange
rate will increase slightly every block, so when you exchange your cDAI back to
DAI a month later, the exchange rate would be, for example 1.01 cDAI per DAI. This means that
you earned 1% interest on your DAI. This mechanic allows interest to be earned by
the entire set of DAI lenders in the protocol by adjusting only a single number
on-chain.

Similarly, the normalization factor in the derivative contract behaves the same
way, but instead _decreases_ the market price by the funding rate over time,
relative to the index price.

## Lifecycle of a Derivative

In this example, we will describe the lifecycle of a derivative which tracks the
temperature of a city in Farenheit. It is assumed that there exists an on-chain
oracle which can provide the temperature of the city in Farenheit. We will call
this derivative `TEMP`.

1. Deploy the `TEMP` index price contract, which exposes:
  * an `indexPrice` function  that returns a `uint256` representing the temperature of the city in Farenheit (multiplied by 10^6).
  * a `fundingRate` function  that returns a `uint256` representing the current funding rate (multiplied by 10^6).
2. Deploy the `TEMP` derivative contract using the `DerivativeFactory` contract,
and pass in the address of the `TEMP` index price contract, which deploys the `TEMPDerivative` contract.
3. The short side mints liquidity by calling the `mint` function on the `TEMPDerivative` contract,
and puts up collateral in the form of USDX. The collateral is locked in the `TEMPDerivative` contract,
and mints `sTEMP` (synthetic temperature) tokens to the short side.
4. The short side sells `sTEMP` tokens to the long side at the market price, which is
the current index price of the derivative, multiplied by the normalization factor.

Now let's look at the 3 possible future scenarios assuming a 12% average funding rate:

### Scenario 1: The temperature of the city goes up 10% over the next month

In this scenario, the index price of the derivative goes up, and the short side
takes a 10% loss, minus the 1% of earnings from the funding rate, totaling a 9% loss.

### Scenario 2: The temperature of the city goes down 10% over the next month

In this scenario, the index price of the derivative goes down, and the short side
takes a 10% gain, plus the 1% of earnings from the funding rate, totaling a 11% gain.

### Scenario 3: The temperature of the city stays the same over the next month

In this scenario, the index price of the derivative stays the same, and the short side
takes a 0% gain, plus the 1% of earnings from the funding rate, totaling a 1% gain.

## Price Pegging Mechanism

Due to the fact that `sTEMP` in the example above can always be redeemed for
the underlying USDX collateral at the market price, as well as minted at the
market price, the market price of `sTEMP` on other exchanges should always be
equal to the market price of `sTEMP` on Radian, otherwise there will be an
arbitrage opportunity. For example:

Since the market price to mint is computed by the index price, this means that
anyone can always mint more `sTEMP` at that price. So if the price of `sTEMP` goes
above the market price, then there will be an arbitrage opportunity to mint more
`sTEMP` and sell it at the market price.

Similarly, since `sTEMP` can always be redeemed for the underlying USDX collateral
at the market price, if the price of `sTEMP` goes below the market price, then
there will be an arbitrage opportunity to buy `sTEMP` at the market price and
redeem it for USDX.

This means that the primary method via which to go long `sTEMP` is to simply
buy it from any exchange that lists it.