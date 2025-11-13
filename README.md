# Radian Protocol

The radian protocol is an Revolutionary Autonomous Decentralized protocol that provides a set of economic primitives designed to work with the Radian (RAD) token enabling features far beyond what is capable with CeFi systems while maintaining the trustlessness and decentralization of DeFi.

Built on zkSync Era with account abstraction capabilities, Radian enables gasless transactions, smart wallets, and a unified liquidity layer across trading, lending, and synthetic derivatives.

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

### Radian Token (RAD) & Collector
- RAD represents the total value locked in the protocol
- Non-transferable between wallets (only to/from protocol contracts)
- Collector aggregates all protocol fees and locked value
- Backs the USDX stablecoin

## 🚀 Quick Start

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
```

### Running Components

#### Smart Contracts

See the [contracts README](./packages/contracts/README.md) for detailed instructions.

```bash
cd packages/contracts

# Copy environment variables
cp .env.example .env
# Edit .env with your MNEMONIC and INFURA_API_KEY

# Install dependencies
npm install

# Run tests
forge test

# Run integration tests
npm run test

# Start local blockchain
anvil

# Deploy locally (in another terminal)
npm run deploy
```

#### DApp

```bash
cd apps/dapp

# Install and run
npm install
npm run dev

# Open http://localhost:3000
```

#### Documentation

```bash
cd apps/docs

# Install and run
npm install
npm start

# Open http://localhost:4001
```

#### Using Turbo (Monorepo-wide commands)

```bash
# Build all packages
yarn build

# Run all dev servers
yarn dev

# Lint all packages
yarn lint

# Clean all packages
yarn clean
```

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

## 🧪 Testing

```bash
# Test contracts (Foundry)
cd packages/contracts
forge test

# Integration tests (Hardhat)
cd packages/contracts
npm run test

# Test DApp
cd apps/dapp
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
- **Turborepo** for monorepo management
- **Yarn Workspaces** for dependency management

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
