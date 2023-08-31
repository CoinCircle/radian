'use client';
// Imports
// ========================================================
import React from 'react';
import { Chain, configureChains } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { WagmiConfig, createClient } from "./client";
import { getDefaultProvider, providers } from 'ethers';
import { Provider, utils } from 'zksync-web3';

export const provider = new Provider(`http://localhost:3050`, 270);

/// Chain
// ========================================================

export const zksyncLocal = {
  id: 270,
  name: 'ZKSync (local)',
  network: 'zksync',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://localhost:3050'] },
    default: { http: ['http://localhost:3050'] },
  },
  testnet: true
} as const satisfies Chain
const chains = configureChains(
    [zksyncLocal],
    [jsonRpcProvider({
        rpc: () => ({
            http: `http://localhost:3050`
        })
    })]
);

// Config
// ========================================================
const client = createClient({
    autoConnect: true,
    // connectors: [new InjectedConnector({ chains })],
    provider,
});

// Provider
// ========================================================
const WagmiProvider = ({ children }: { children: React.ReactNode }) => {
    return <WagmiConfig client={client}>{children}</WagmiConfig>
};

// Exports
// ========================================================
export default WagmiProvider;