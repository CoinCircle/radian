import { useAccount, useNetwork } from 'wagmi';



export default function Swap() {
  return (
    <div className="container mx-auto max-w-md border-gray-800 rounded-md border-solid border mt-12 p-2">
      Swap
      <div>
        <div className="mt-1">
          <input
            type="email"
            name="email"
            id="email"
            className="block w-full rounded-md shadow-smb border-opacity-10 sm:text-sm bg-gray-800"
            placeholder="you@example.com"
          />
        </div>
      </div>
    </div>
  )
}