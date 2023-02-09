---
sidebar_position: 0
---

# Overview

Radian is an end-to-end DeFi protocol which provides a set of financial primitives
which -- together -- bring the user experience of CeFi systems while maintaining
the trustlessness and decentralization aspects of DeFi systems.

Although the compatible primitives of Radian are provided on layer 1, core
features of Radian are enabled by running on a layer 2, specifically zkSync.

Radian can be seen as split into 2 distinct _types_ of protocol contracts - *core
modules*, and *Defi modules*. These are described in more detail below.

## Core Modules

The core modules are the backbone that enable a unique user experience, as well
as the ability for the economics of Radian to be self-sustaining.

### Core: Smart Wallet

An account-abstraction contract which allows users to interact with the protocol
without having to manage private keys or gas.

### Core: Paymaster

A contract which allows users to pay for gas fees in
  any token, so long as that token has enough liquidity on the exchange.

### Core: Wallet Modules

These can be thought of "apps" that can be installed into a Radian smart wallet.
Anyone can build their own wallet module, and users can choose which wallet modules
they want to install into their smart wallet. This enables, for example, the
ability for a debit card to spend funds, or subscription services to automatically pay for recurring payments.


## Defi Modules

Defi modules enable the financial primitives of the Radian protocol

### Defi: Collector + RAD

Because Radian is built such that it can be compatible with any representation
of value whether it be a stablecoin, a token, a derivative, or an NFT, this value
must somehow be "summarized" into a single value. Radian (RAD) is the native
token of the protocol. Unlike other tokens, this token cannot leave the protocol
and therefore cannot be traded or trasferred outside of the protocol.

To give a more technical description, RAD token transfers require either the "from" or
"to" address to be some contract of the protocol itself. This means it can be
transferred from the protocol to your wallet, but not from your wallet to another
wallet (however you will still be able to transfer it back to the protocol).

Some parts of the protocol may incur fees (such as trades or the paymaster), and
some parts of the protocol may lock tokens (such as posting collateral for a loan).
Any sort of value such as this is stored in the Radian collector contract. The
collector stores two types of value - "locked" and "unlocked". Unlocked value
means that value belongs to holders of RAD. This allows RAD to have a value that
is linearly correlated to the sum of the unlocked value in the collector. This
can then be used to represent, in a single token, the locked value in the protocol.
This value is then used to enable backing value of the USDX stable coin, as well
as to enable the exchange.

### Defi: Stablecoin

The stablecoin in Radian is called USDX. It is a stable coin backed by RAD, which
in turn means it can be backed by anything of value. For example, if you want to
mint USDX using a token, you can do so, so long as that token has liquidity on
the Radian exchange. The value of the token is based on the price in the exchange.

Analogous to the mechanics of DAI, this means that should the price of the token
on the exchange drop too much, users will be able to liquidate the borrower.

### Defi: Exchange

The exchange is a uniswap-like AMM which allows users to trade between any
token. The exchange is built such that it can be used to trade any token, even
ones which are not native to the protocol. Unlike Uniswap, one side of each
pool is always USDX. This has a few benefits:

1. Since there is never more than a single pair involving a specific token, a trade
never requires more than 1 hop, whereas the number of hops is potentially unbounded in Uniswap.
2. It is much easier for the protocol to determine the prices of things in terms
of USD value.
3. It makes it possible to implement a mechanism where the protocol itself can
provide one side of the liquidity in the pool, whereas in Uniswap it is always
required for liquidity providers to provide both sides of the pool.


### Defi: Uncollateralized Lending (V1)

The combination of smart wallets with the protocol allows for the enabling of
uncollateralied lending. We are working on a version of this module that is
completely unconstrained and represents more closely the "traditional" lending
system, but in the first version the uncollateralized lending system has two
constraints:

1. If a creditor defaults, it is the party to whom they paid the borrowed money
for which is taking the risk. For this reason, when accepting a payment where
the funds originated from an uncollateralized loan, the payee must accept the
risk that the funds may be from an uncollateralized loan. For this reason a
reputation system is implemented to allow payees to determine whether or not
they want to accept the risk of accepting a payment from an uncollateralized
loan.
2. The payment itself is wrapped into an ERC-115 NFT, and cannot be unwrapped
unless the creditor has a healthy balance sheet.

At a high-level, the uncollateralized lending system works as follows:

1. A user wants to buy something for $10.
2. The user borrows $10 from the protocol - this is received by the user in the
form of an NFT that contains the payment, as well as some metadata in order to
identify the original borrower. This allows the payee to see who the original
borrower was, and to see the reputation of the original borrower.
3. So long as the user has a healthy balance sheet, they can unwrap the NFT. If
the user does not have a healthy balance sheet, the payee will need to wait until
the user has a healthy balance sheet before they can unwrap the NFT.