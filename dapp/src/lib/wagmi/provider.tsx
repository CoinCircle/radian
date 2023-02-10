'use client';
// Imports
// ========================================================
import React from 'react';
import { WagmiConfig, createClient } from "wagmi";
import { getDefaultProvider, providers } from 'ethers';

const provider = new providers.JsonRpcProvider(`http://127.0.0.1:8545`)

// Config
// ========================================================
const client = createClient({
    autoConnect: true,
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