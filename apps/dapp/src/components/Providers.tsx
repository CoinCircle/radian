'use client';
import WagmiProvider from '~/lib/wagmi/provider'
import { Provider } from 'react-redux'
import { store } from '~/lib/state/redux'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <WagmiProvider>
        {children}
      </WagmiProvider>
    </Provider>
  )
}