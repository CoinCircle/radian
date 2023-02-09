---
sidebar_position: 2
---

# Dynamic Funding Rate

One of the key attributes of synthetic perpetuals that allows them to be such a
flexible and dynamic DeFi primitive is the dynamic funding rate. A static funding
rate would limit the types of perpetuals that can be created in such a way where
the economics works for both sides, because the risk for the short side would
be constant, and therefore it would mean the economic inventive for one side
would only make sense if the underlying index had a risk profile that can be
represented by a static funding rate.

To enable a primitive that works for any type of index, we need a funding rate
that is dynamic over time. Implementing something like this in a centralized
system is much simpler than on-chain, because mutations cost gas.

Below we detail the mechanics of how the funding rate works in Radian, as well
as the reasoning behind the design of these mechanics.

## Illustration

To understand the mechanics better, let's look at an example of what a funding
rate might look like over time. Below, we have a funding rate that starts
out at 1% for a short period, increases to 5% for a longer period, and then
decreases back to 1% for a short period:

![Funding Rate Example](/img/funding-rate.jpeg)

Lending protocols have the advantageous property that the mutations themselves
affect the interest rate so they can safely compute a static value in each
mutation.

However in the case of Radian Perpetuals, anything can be represented as an
index price, and there is not necessarily a one-to-one mapping between mutations
and changes to the index price and/or funding rate.

In the above example, if perpetuals worked the same way, and mutations were only
to occur at t<sub>1</sub> and and t<sub>4</sub>, then the short side would have
received no funding rate at all. Therefore we need to allow funding rate changes
to occur at any time.

## Mechanics

Based on the above, a requirement of the protocol is that the contract must compute
each change in the funding rate as a list of tuples that contain `(timestamp, fundingRate)`
since the last change. Assuming that the last update was at t<sub>1</sub>,
and we are currently at t<sub>4</sub>, our contract would return the following:

```js
[
  [2, 0.05], // t2
  [9, 0.01], // t3
]
```

Furthermore, the function to apply the funding rate has the following attributes:

1. It is callable by anyone. Although it costs gas, we envision that so long as
applying the change is profitable, market participants will be incentivized to
apply the change.

2. An additional parameter `uint maxSteps` is passed in. This is to allow users
to configure the maximum number of steps they are willing to apply. This prevents
a scenario where an illiquid market with a funding rate that changes often
gets into a state where the funding rate is unable to be changed due to
gas limits, since in an illiquid market, there is less incentive for users to
apply the funding rate.