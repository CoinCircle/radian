### Could perpetual contracts be used to implement inverse debt?

* In this case the short side would be short a stable coin, so the only econominc
incentive would be to earn yield from the funding rate.

* They would be putting up stable coin as collateral, this is ultimately the
"credit" being lent out.

* Mark = inverse peg, price goes up as peg goes down



### Simple Naive version

* System starts $100 standard pool
* Over time, $10 of interest earned from collateralized lending
* $5 paid to lenders, $5 to treasury
* Only treasury can lend un-collateralized


### Alt

* System starts with $100 in stable, provided by lender
* Users start with score of 0, goes up as they pay back loans
* Merchants can decide to accept or reject these payments based on score of user
* Once they accept, they payment amount (e.g. $10) is wrapped in an NFT.
* The NFT has an expiration, e.g. "Net 30". In this case, the user has 30 days
to pay the $10 back to the system.
* If the user pays back the $10, the NFT unlocks and the merchant can unwrap it.
* If the user defaults, the NFT is burned and the merchant loses the $10, as it
goes back to the system.



### Global liquidity/volatility requirements

Since there is no whitelist, assets that activate on the ecosystem have the
ability to affect the ecosystem as a whole in a negative manner. For example,
low liquidity assets could be used to create a flash loan attack on the system.

Therefore the following requirements are needed:
  * Volatility below GLOBAL_MIN_VOLATILITY
    * volatility is defined as the Standard Deviation of log-returns for the last GLOBAL_VOLATILITY_WINDOW seconds
    * log-returns are calculated as log(price(t)) - log(price(t-1))
    * Price is calaulted using the TWAP of the last GLOBAL_TWAP_WINDOW seconds
    * TWAP uses geometric mean rather than arithmetic mean (n1 * n2 * n3 * ... * nN)^(1/N)
  * Liquidity above GLOBAL_MIN_LIQUIDITY
    * liquidity is denoted in terms of stablecoin
    * liquidity is calulated as the geometric mean over a window of GLOBAL_LIQUIDITY_WINDOW seconds