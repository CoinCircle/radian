# Radian Protocol

Radian protocol is a revolutionary autonomous decentralized protocol that provides a set of economic primitives designed to work with the Radian (RAD) token.  Radian protocol's goal is to create a complete sustainable non-zero-sum crypto-economy capable of self-goverened autonomous growth enabling features far beyond what is capable with CeFi systems while maintaining the trustlessness and decentralization of DeFi.

Built on zkSync Era with account abstraction capabilities, Radian enables gasless transactions, smart wallets, and a unified liquidity layer across trading, lending, and synthetic derivatives.

Note: This is the in-progress v2 protocol codebase. The live v1 Radian (RAD) token code (currently deployed on the Ethereum Mainnet) can be found [here](https://github.com/CoinCircle/radian-token).

## 🏗️ Architecture

This is a monorepo containing all components of the Radian protocol:

```
radian/
├── packages/
│   ├── contracts/     # Solidity smart contracts (Foundry + Hardhat)
│   └── sdk/          # TypeScript SDK
└── apps/
    ├── dapp/         # Next.js web application
    └── docs/         # Docusaurus documentation site
```

## 🧩 Core Modules

### Radian Token v2 (RAD) & Collector
- RAD represents the total value locked in the protocol
- Non-transferable between wallets (only for governance and to/from protocol contracts)
- Collector aggregates all protocol fees and locked value
- Backs the USDX stablecoin
- Multi-token model converts RAD <-> RADX liquidity token 1:1 for exiting protocol

### Smart Wallet & Paymaster
- **Account Abstraction**: Interact without managing private keys or gas
- **Gasless Transactions**: Pay fees in any token with sufficient liquidity
- **Wallet Modules**: Extensible "apps" for smart wallets (debit cards, subscriptions, etc.)

### Exchange (DEX)
- Uniswap V3-based AMM with USDX as the common denominator for all pairs
- Single-hop trading (no multi-hop routing needed)
- Leveraged trading with protocol as counterparty
- Shared liquidity with lending markets
- Alternative price curves support (options, stablecoin pools)

### Stablecoin (USDX)
- Backed by RAD token (which represents all protocol value)
- Mint using any token with exchange liquidity
- DAI-like mechanics with liquidations

### Lending (Money Market)
- Overcollateralized and undercollateralized lending
- Shared liquidity with the exchange
- No asset whitelist - permissioned mathematically by liquidity
- Yield boosts via RAD rewards

### Synthetic Derivatives (Perpetuals)
- Create derivatives for **any** numerical value (not just prices)
- Based on [Paradigm's Power Perpetuals](https://www.paradigm.xyz/2021/08/power-perpetuals)
- Dynamic funding rates
- Examples: temperature, volatility indices, sports scores, etc.

## 📚 Documentation

Full documentation is available at the [docs site](./apps/docs) or by running `cd apps/docs && npm start`.

Key documentation:
- [Protocol Overview](./apps/docs/docs/overview.md)
- [Exchange Module](./apps/docs/docs/exchange/)
- [Lending Module](./apps/docs/docs/lending/)
- [Perpetuals Module](./apps/docs/docs/perpetuals/)
- [Stablecoin Module](./apps/docs/docs/stablecoin/)
- [Paymaster](./apps/docs/docs/paymaster/)
- [Protocol Tokens](./apps/docs/docs/protocol-tokens/)

## 🚀 Dev Quick Start

### Prerequisites

- Node.js 16+ and Yarn
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for contracts)

### Installation

```bash
# Clone the repository
git clone https://github.com/CoinCircle/radian.git
cd radian

# Install dependencies
yarn install

# If you get build errors try running with ignore scripts:
yarn install --ignore-scripts
```

### Running Components

#### Smart Contracts

See the [contracts README](./packages/contracts/README.md) for detailed instructions.

```bash
cd packages/contracts

# Copy environment variables
cp .env.example .env
# Edit .env with your MNEMONIC and INFURA_API_KEY

# Run tests
forge test

# Run integration tests
npm run test

# Start local blockchain
anvil

# Build
npm run build

# Deploy locally (in another terminal)
npm run deploy
```

#### DApp

```bash
# From workspace root:
# Option 1: From root (recommended)
yarn workspace dapp dev

# Option 2: From dapp directory
cd apps/dapp
yarn dev

# Open http://localhost:3000
```


#### Documentation

```bash
# From workspace root:
# Option 1: From root (recommended)
yarn workspace docs start

# Option 2: From docs directory  
cd apps/docs
yarn start

# Open http://localhost:4001
```


## 🧪 Testing

```bash
# Test contracts (Foundry)
cd packages/contracts
forge test

# Integration tests (Hardhat)
cd packages/contracts
npm run test

```

## 📦 Deployments

Contract deployments are tracked in [`packages/contracts/deployments.json`](./packages/contracts/deployments.json).

## 🔧 Development

This project uses:
- **Foundry** for Solidity development and testing
- **Hardhat** for integration tests and deployments
- **Next.js** for the frontend
- **Docusaurus** for documentation
- **Yarn Workspaces** for repo & dependency management

## 📄 License

See [LICENSE](./packages/contracts/LICENSE) for details.

## 🤝 Contributing

This is a work-in-progress development. Contributions welcome!

## 🔗 Links

- [zkSync Era Documentation](https://era.zksync.io/docs/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Paradigm Power Perpetuals Paper](https://www.paradigm.xyz/2021/08/power-perpetuals)

---

**Status**: 🚧 Work in Progress
