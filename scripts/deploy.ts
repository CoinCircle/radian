import hre from 'hardhat';

import * as zksync from 'zksync-web3';
import { chainIds, VERBOSE, ZK_EVM } from '../hardhat.config';
import * as Types from '../types';
import { deployWait } from './utils';
import { GasOptions } from './types';
import { Wallet, ethers } from 'ethers';

import { Deployer as zkDeployer } from '@matterlabs/hardhat-zksync-deploy';

// --- Helper functions for deploying contracts ---

// Also adds them to hardhat-tracer nameTags, which gives them a trackable name
// for events when `npx hardhat test --logs` is used.

// deployCounter deploys the Counter contract with an initial count value.
export async function deployCounter(
  wallet: Wallet,
  gasOpts?: GasOptions,
  initCount?: number,
): Promise<Types.Counter> {
  if (initCount === undefined) {
    initCount = 0;
  }

  let counterContract: Types.Counter;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`Counter`);
    counterContract = (await deployWait(
      deployer.deploy(zkArtifact, [initCount], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.Counter;
  } else {
    const counter: Types.Counter__factory = await hre.ethers.getContractFactory(`Counter`, wallet);
    counterContract = await deployWait(
      counter.deploy(initCount, {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`Counter: ${counterContract.address}`);
  hre.tracer.nameTags[counterContract.address] = `Counter`;

  return counterContract;
}

// deployAirdrop deploys the Counter contract with an initial count value.
export async function deployAirdrop(
  wallet: Wallet,
  owner: string,
  token: string,
  gasOpts?: GasOptions,
): Promise<Types.Airdrop> {
  let airdropContract: Types.Airdrop;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`Airdrop`);
    airdropContract = (await deployWait(
      deployer.deploy(zkArtifact, [owner], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.Airdrop;
  } else {
    const airdrop: Types.Airdrop__factory = await hre.ethers.getContractFactory(`Airdrop`, wallet);
    airdropContract = await deployWait(
      airdrop.deploy(owner, token, {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`Airdrop: ${airdropContract.address}`);
  hre.tracer.nameTags[airdropContract.address] = `Airdrop`;

  return airdropContract;
}

// deployWalletFactory deploys the WalletFactory contract.
export async function deployWalletFactory(
  wallet: Wallet,
  gasOpts?: GasOptions,
): Promise<Types.WalletFactory> {
  let contract: Types.WalletFactory;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`WalletFactory`);
    const walletArtifiact = await deployer.loadArtifact(`Wallet`);
    const bytecodeHash = zksync.utils.hashBytecode(walletArtifiact.bytecode);
    console.log(`Wallet bytecode hash: ${ethers.utils.hexlify(bytecodeHash)}`);
    contract = (await deployWait(
      deployer.deploy(
        zkArtifact,
        [bytecodeHash],
        {
          maxFeePerGas: gasOpts?.maxFeePerGas,
          maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
          gasLimit: gasOpts?.gasLimit,
        },
        [walletArtifiact.bytecode],
      ),
    )) as Types.WalletFactory;
  } else {
    // This probably won't work on L1
    const factory: Types.WalletFactory__factory = await hre.ethers.getContractFactory(
      `WalletFactory`,
      wallet,
    );
    contract = await deployWait(
      factory.deploy([], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`WalletFactory: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `WalletFactory`;

  return contract;
}

// isZkDeployment returns if ZK_EVM is true and the network is a supported zk rollup.
async function isZkDeployment(wallet: Wallet): Promise<boolean> {
  const net = await wallet.provider.getNetwork();
  return (
    ZK_EVM &&
    (net.chainId === chainIds[`zksync-mainnet`] || net.chainId === chainIds[`zksync-goerli`])
  );
}
