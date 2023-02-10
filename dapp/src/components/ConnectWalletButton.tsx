'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from '@wagmi/core';

export default function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
        <button className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
      <button className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700" onClick={() => connect()}>
        Connect Wallet
      </button>
    </div>
  )
}