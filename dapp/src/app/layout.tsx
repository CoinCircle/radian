import './globals.css'
import Header from '~/components/Header'
import WagmiProvider from '~/lib/wagmi/provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body>
        <WagmiProvider>
          <Header />
          {children}
        </WagmiProvider>
      </body>
    </html>
  )
}
