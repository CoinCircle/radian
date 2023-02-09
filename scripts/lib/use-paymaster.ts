import hre from 'hardhat';
import { Provider, utils, Wallet } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as Types from '../../types';
import { Contracts } from '../types';


export default async function (
  wallet: Wallet,
  receiver: Wallet,
  contracts: Contracts,
  provider: Provider,
): Promise<void> {
  await ensureUniswapPool(wallet, receiver, contracts, provider);
  // Obviously this step is not required, but it is here purely to demonstrate
  // that indeed the wallet has no ether.
  const ethBalance = await wallet.getBalance();
  // if (!ethBalance.eq(0)) {
  //   throw new Error(`The wallet is not empty`);
  // }

  console.log(
    `Balance of the user before mint: ${await contracts.radianX.balanceOf(wallet.address)}`,
  );

  const gasPrice = await provider.getGasPrice();

  const transferAmount = 100;
  const maxGasCostInTokens = 5;
  // Estimate gas fee for transfer transaction
  const gasLimit = await contracts.radianX.estimateGas.transfer(receiver.address, transferAmount, {
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: {
        paymaster: contracts.radianPaymaster.address,
        paymasterInput: `0x`,
      },
    },
  });
  const fee = gasPrice.mul(gasLimit.toString());

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(contracts.radianPaymaster.address, {
    type: `ApprovalBased`,
    token: contracts.radianX.address,
    // set minimalAllowance as we defined in the paymaster contract
    minimalAllowance: ethers.BigNumber.from(maxGasCostInTokens),
    innerInput: new Uint8Array(),
  });

  await (
    await contracts.radianX.transfer(receiver.address, transferAmount, {
      // provide gas params manually
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice,
      gasLimit,

      // paymaster info
      customData: {
        paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  console.log(
    `Balance of the user after mint: ${await contracts.radianX.balanceOf(wallet.address)}`,
  );
}

// The paymaster will only accept tokens that have uniswap liquidity. So we
// need to add some if it doesnt exist.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function ensureUniswapPool(
  wallet: Wallet,
  _receiver: Wallet,
  contracts: Contracts,
  provider: Provider,
) {
  let pool = await contracts.uniswapFactory.getPool(
    contracts.radianX.address,
    contracts.weth.address,
    ethers.BigNumber.from(`3000`),
  );
  if (pool == ethers.constants.AddressZero) {
    console.error(`No uniswap pool found, creating one`);
    await (
      await contracts.uniswapFactory.createPool(
        contracts.radianX.address,
        contracts.weth.address,
        ethers.BigNumber.from(`3000`),
      )
    ).wait();
  }
  pool = await contracts.uniswapFactory.getPool(
    contracts.radianX.address,
    contracts.weth.address,
    ethers.BigNumber.from(`3000`),
  );
  console.log(`Uniswap pool address: ${pool}`);
  if (!pool) {
    throw new Error(`No uniswap pool found`);
  }
  const gasPrice = await provider.getGasPrice();
  const poolArtifact = await hre.ethers.getContractFactory(`UniswapV3Pool`);
  const poolContract = poolArtifact.connect(wallet).attach(pool);
  const liquidity = await poolContract.liquidity();
  if (liquidity.eq(0)) {
    console.log(`No liquidity in the pool, adding some`);
    const amount0ToMint = ethers.BigNumber.from(`100000000000000000`);
    const amount1ToMint = ethers.BigNumber.from(`100000000000000000`);
    const allowance0 = await contracts.radianX.allowance(
      wallet.address,
      contracts.uniswapNFTManager.address,
    );
    if (allowance0.lt(amount0ToMint)) {
      console.log(`Approving radianX`);
      await (
        await contracts.radianX.approve(
          contracts.uniswapNFTManager.address,
          ethers.constants.MaxUint256,
        )
      ).wait();
      console.log(`Approved radianX`);
    }
    const allowance1 = await contracts.weth.allowance(
      wallet.address,
      contracts.uniswapNFTManager.address,
    );
    if (allowance1.lt(amount1ToMint)) {
      console.log(`Approving weth`);
      await (
        await contracts.weth.approve(
          contracts.uniswapNFTManager.address,
          ethers.constants.MaxUint256,
        )
      ).wait();
      console.log(`Approved weth`);
    }
    const factoryAddr = await contracts.uniswapNFTManager.factory();
    const wethAddr = await contracts.uniswapNFTManager.WETH9();
    console.log(`factoryAddr: ${factoryAddr}`);
    console.log(`wethAddr: ${wethAddr}`);
    const wethBalance = await contracts.weth.balanceOf(wallet.address);
    console.log(`WETH balance`, wethBalance.toString());
    if (wethBalance.lt(amount1ToMint)) {
      console.log(`Minting some weth`);
      await (
        await contracts.weth.deposit({
          value: amount1ToMint,
          gasLimit: 10000000,
          gasPrice,
        })
      ).wait();
      console.log(`Minted some weth`);
    }
    const params: Types.INonfungiblePositionManager.MintParamsStruct = {
      token0: contracts.weth.address,
      token1: contracts.radianX.address,
      fee: ethers.BigNumber.from(`3000`),
      tickLower: ethers.BigNumber.from(`-6000`),
      tickUpper: ethers.BigNumber.from(`6000`),
      amount0Desired: amount0ToMint,
      amount1Desired: amount1ToMint,
      amount0Min: 0,
      amount1Min: 0,
      recipient: wallet.address,
      deadline: ethers.BigNumber.from(Math.floor(Date.now() / 1000) + 1800),
    };
    const tx = await contracts.uniswapNFTManager.mint(params, {
      gasLimit: 10000000,
      gasPrice,
    });
    const receipt = await tx.wait();
    console.log(`Liquidity added`, receipt);
  }
}