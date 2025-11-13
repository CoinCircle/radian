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

// deployAirdrop deploys the Counter contract with an initial count value.
export async function deployAirdrop(
  wallet: Wallet,
  owner: string,
  token: string,
  gasOpts?: GasOptions,
): Promise<Types.Airdrop> {
  let contract: Types.Airdrop;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`Airdrop`);
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [owner], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.Airdrop;
  } else {
    const airdrop: Types.Airdrop__factory = await hre.ethers.getContractFactory(`Airdrop`, wallet);
    contract = await deployWait(
      airdrop.deploy(owner, token, {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`Airdrop: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `Airdrop`;

  return contract;
}

// deployRadianX deploys the Counter contract with an initial count value.
export async function deployRadianX(wallet: Wallet, gasOpts?: GasOptions): Promise<Types.RadianX> {
  let contract: Types.RadianX;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`RadianX`);
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [], {
        gasLimit: gasOpts?.gasLimit,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        maxFeePerGas: gasOpts?.maxFeePerGas,
      }),
    )) as Types.RadianX;
  } else {
    const radianx: Types.RadianX__factory = await hre.ethers.getContractFactory(`RadianX`, wallet);
    contract = await deployWait(
      radianx.deploy({
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`RadianX: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `RadianX`;

  return contract;
}

// deployRadianPaymaster deploys the Counter contract with an initial count value.
export async function deployRadianPaymaster(
  wallet: Wallet,
  uniswapV3FactoryAddress: string,
  swapRouterAddress: string,
  wethAddress: string,
  gasOpts?: GasOptions,
): Promise<Types.RadianPaymaster> {
  let contract: Types.RadianPaymaster;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`RadianPaymaster`);
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [uniswapV3FactoryAddress, swapRouterAddress, wethAddress], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.RadianPaymaster;
    if (hre.network.verifyURL) {
      await hre.run(`verify:verify`, {
        address: contract.address,
        constructorArguments: [uniswapV3FactoryAddress, swapRouterAddress, wethAddress],
      });
    }
  } else {
    const factory: Types.RadianPaymaster__factory = await hre.ethers.getContractFactory(
      `RadianPaymaster`,
      wallet,
    );
    contract = await deployWait(
      factory.deploy(uniswapV3FactoryAddress, swapRouterAddress, wethAddress, {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`RadianPaymaster: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `RadianPaymaster`;

  return contract;
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

// deployUniswapFactory deploys the Counter contract with an initial count value.
export async function deployUniswapFactory(
  wallet: Wallet,
  gasOpts?: GasOptions,
): Promise<Types.ExchangePoolFactory> {
  let contract: Types.ExchangePoolFactory;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`ExchangePoolFactory`);
    const gasPrice = await wallet.getGasPrice();
    console.log({ gasPrice });
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.ExchangePoolFactory;
  } else {
    const factory: Types.ExchangePoolFactory__factory = await hre.ethers.getContractFactory(
      `ExchangePoolFactory`,
      wallet,
    );
    contract = await deployWait(
      factory.deploy({
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`ExchangePoolFactory: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `ExchangePoolFactory`;

  return contract;
}

// deployUniswapRouter deploys the Counter contract with an initial count value.
export async function deployUniswapRouter(
  wallet: Wallet,
  factoryAddress: string,
  wethAddress: string,
  gasOpts?: GasOptions,
): Promise<Types.SwapRouter> {
  let contract: Types.SwapRouter;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`SwapRouter`);
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [factoryAddress, wethAddress], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.SwapRouter;
    if (hre.network.verifyURL) {
      await hre.run(`verify:verify`, {
        address: contract.address,
        constructorArguments: [factoryAddress, wethAddress],
      });
    }
  } else {
    const factory: Types.SwapRouter__factory = await hre.ethers.getContractFactory(
      `SwapRouter`,
      wallet,
    );
    contract = await deployWait(
      factory.deploy(factoryAddress, wethAddress, {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`SwapRouter: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `SwapRouter`;

  return contract;
}

// deployWETH deploys the Counter contract with an initial count value.
export async function deployWETH(wallet: Wallet, gasOpts?: GasOptions): Promise<Types.WETH9> {
  let contract: Types.WETH9;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`WETH9`);
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.WETH9;
  } else {
    const factory: Types.WETH9__factory = await hre.ethers.getContractFactory(`WETH9`, wallet);
    contract = await deployWait(
      factory.deploy({
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`WETH9: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `WETH9`;

  return contract;
}
// deployWETH deploys the Counter contract with an initial count value.
export async function deployUniswapNFTPositionManager(
  wallet: Wallet,
  factoryAddress: string,
  wethAddress: string,
  descriptorAddress: string,
  gasOpts?: GasOptions,
): Promise<Types.NonfungiblePositionManager> {
  let contract: Types.NonfungiblePositionManager;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(`NonfungiblePositionManager`);
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [factoryAddress, wethAddress, descriptorAddress], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.NonfungiblePositionManager;
  } else {
    const factory: Types.NonfungiblePositionManager__factory = await hre.ethers.getContractFactory(
      `NonfungiblePositionManager`,
      wallet,
    );
    contract = await deployWait(
      factory.deploy(factoryAddress, wethAddress, descriptorAddress, {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`NonfungiblePositionManager: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `NonfungiblePositionManager`;

  return contract;
}
// deployWETH deploys the Counter contract with an initial count value.
export async function deployUniswapNFTDescriptor(
  wallet: Wallet,
  weth9Addr: string,
  gasOpts?: GasOptions,
): Promise<Types.NonfungibleTokenPositionDescriptor> {
  let contract: Types.NonfungibleTokenPositionDescriptor;
  if (await isZkDeployment(wallet)) {
    const deployer = zkDeployer.fromEthWallet(hre, wallet);
    const zkArtifact = await deployer.loadArtifact(
      `contracts/exchange/periphery/NonfungibleTokenPositionDescriptor.sol:NonfungibleTokenPositionDescriptor`,
    );
    contract = (await deployWait(
      deployer.deploy(zkArtifact, [weth9Addr, ethers.utils.formatBytes32String(`ETH`)], {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    )) as Types.NonfungibleTokenPositionDescriptor;
  } else {
    const factory: Types.NonfungibleTokenPositionDescriptor__factory =
      await hre.ethers.getContractFactory(`NonfungibleTokenPositionDescriptor`, wallet);
    contract = await deployWait(
      factory.deploy(weth9Addr, ethers.utils.formatBytes32String(`ETH`), {
        maxFeePerGas: gasOpts?.maxFeePerGas,
        maxPriorityFeePerGas: gasOpts?.maxPriorityFeePerGas,
        gasLimit: gasOpts?.gasLimit,
      }),
    );
  }

  if (VERBOSE) console.log(`NonfungibleTokenPositionDescriptor: ${contract.address}`);
  hre.tracer.nameTags[contract.address] = `NonfungibleTokenPositionDescriptor`;

  return contract;
}

// isZkDeployment returns if ZK_EVM is true and the network is a supported zk rollup.
async function isZkDeployment(wallet: Wallet): Promise<boolean> {
  const net = await wallet.provider.getNetwork();
  return (
    ZK_EVM &&
    (net.chainId === chainIds[`zksync-mainnet`] ||
      net.chainId === chainIds[`zksync-goerli`] ||
      net.chainId === chainIds[`zksync-local`])
  );
}
