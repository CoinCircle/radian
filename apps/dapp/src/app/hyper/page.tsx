'use client';
import { Radian } from '@radian/sdk';
import { useBalance, useAccount } from 'wagmi';
import { utils } from 'zksync-web3';

export default function Page() {
  const { address } = useAccount();
  const { data } = useBalance({ address });
  return (
    <div>
      hyper
      <br />
      Balance: {data?.formatted || 0} ETH
    </div>
  )
}