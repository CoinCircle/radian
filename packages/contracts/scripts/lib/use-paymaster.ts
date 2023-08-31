import hre from 'hardhat';
import { Provider, utils, Wallet } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as Types from '../../types';
import { Contracts } from '../types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';


export default async function (
  wallet: Wallet,
  receiver: Wallet,
  contracts: Contracts,
  provider: Provider,
): Promise<void> {
  const pool = await ensureUniswapPool(wallet, receiver, contracts, provider);
  // await wallet.sendTransaction({
  //   to: contracts.radianPaymaster.address,
  //   value: ethers.utils.parseEther(`1`),
  // })
  // Obviously this step is not required, but it is here purely to demonstrate
  // that indeed the wallet has no ether.
  const ethBalance = await wallet.getBalance();
  // if (!ethBalance.eq(0)) {
  //   throw new Error(`The wallet is not empty`);
  // }

  console.log(
    `Balance of the user before mint: ${await contracts.radianX.balanceOf(wallet.address)}`,
  );

  const paymasterBalance = await contracts.radianX.balanceOf(contracts.radianPaymaster.address);
  console.log(`Paymaster balance: ${paymasterBalance}`);

  const gasPrice = await provider.getGasPrice();

  const transferAmount = 100;
  const maxGasCostInTokens = `9999900000000000203935`;
  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(contracts.radianPaymaster.address, {
    type: `ApprovalBased`,
    token: contracts.radianX.address,
    // set minimalAllowance as we defined in the paymaster contract
    minimalAllowance: ethers.BigNumber.from(maxGasCostInTokens),
    innerInput: new Uint8Array(),
  });
  // // Estimate gas fee for transfer transaction
  // const gasLimit = await contracts.radianX.estimateGas.transfer(receiver.address, transferAmount, {
  //   from: wallet.address,
  //   customData: {
  //     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //     paymasterParams,
  //   },
  // });
  // const fee = gasPrice.mul(gasLimit.toString());
  let txHash = '';
  try {
    const tx = await contracts.radianX.transfer(receiver.address, transferAmount, {
      // provide gas params manually
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice,

      // paymaster info
      customData: {
        paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    });
    txHash = tx.hash;
    await tx.wait();
  } catch (e) {
    console.error(e);
    // get the logs from the tx
    const receipt = await provider.getTransactionReceipt(txHash);
    // decode logs using exchange pool factory abi
    const decodedLogs = await pool?.queryFilter(pool.filters.Swap(), receipt.blockNumber, receipt.blockNumber);
    console.log(decodedLogs);

  }

  console.log(
    `Balance of the user after mint: ${await contracts.radianX.balanceOf(wallet.address)}`,
  );

  const receipt = await provider.getTransactionReceipt(txHash);
  // decode logs for all contracts
  receipt.logs.forEach((log) => {
    console.log({ log })
    try {
      const decodedLog = contracts.radianPaymaster.interface.parseLog(log);
      console.log(decodedLog);
    } catch (e) {}
  });



}

// The paymaster will only accept tokens that have uniswap liquidity. So we
// need to add some if it doesnt exist.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function ensureUniswapPool(
  wallet: Wallet,
  _receiver: Wallet,
  contracts: Contracts,
  provider: Provider,
): Promise<any> {
  let pool = await contracts.exchangePoolFactory.getPool(
    contracts.radianX.address,
    contracts.weth.address,
    ethers.BigNumber.from(`3000`),
  );
  if (pool == ethers.constants.AddressZero) {
    console.error(`No uniswap pool found, creating one`);
    await (
      await contracts.exchangePoolFactory.createPool(
        contracts.weth.address,
        contracts.radianX.address,
        ethers.BigNumber.from(`3000`)
      )
    ).wait();
  }
  pool = await contracts.exchangePoolFactory.getPool(
    contracts.weth.address,
    contracts.radianX.address,
    ethers.BigNumber.from(`3000`),
  );
  console.log(`Uniswap pool address: ${pool}`);
  if (!pool) {
    throw new Error(`No uniswap pool found`);
  }
  const gasPrice = await provider.getGasPrice();
  const deployer = Deployer.fromEthWallet(hre, wallet)
  const palArtifact = await deployer.loadArtifact(`PoolAddress`);

  const contract = (await (
    deployer.deploy(palArtifact, [], {
      gasPrice
    })
  ));

  const palFactory = await hre.ethers.getContractFactory('PoolAddress');
  const palContract = palFactory.connect(wallet).attach(contract.address);
  const token0 = contracts.weth.address < contracts.radianX.address ? contracts.weth.address : contracts.radianX.address;
  const token1 = contracts.weth.address < contracts.radianX.address ? contracts.radianX.address : contracts.weth.address;

  console.log('actual pool address', pool);



  const poolArtifact = await hre.ethers.getContractFactory(`ExchangePool`);
  const bytecode = (await deployer.loadArtifact(`ExchangePool`)).deployedBytecode;
  const bytecodeHash = utils.hashBytecode(bytecode);
  // console.log(`Pool bytecode: ${ethers.utils.hexlify(bytecode)}`);
  console.log(`Pool bytecode hash: ${ethers.utils.hexlify(bytecodeHash)}`);
  const abiCoder = new ethers.utils.AbiCoder();
  const c2 = utils.create2Address(
    contracts.exchangePoolFactory.address,
    bytecodeHash,
    ethers.utils.keccak256(abiCoder.encode(['address', 'address', 'uint24'], [token0, token1, ethers.BigNumber.from(`3000`)])),
    '0x',
  );
  console.log(`sdk-computed pool address: ${c2}`);
  const computeAddressExternal = await palContract.functions.computeAddressExternal(
    contracts.exchangePoolFactory.address,
    token0,
    token1,
    ethers.BigNumber.from(`3000`),
  );
  console.log('contract-computed pool address (computeAddressExternal)', computeAddressExternal[0]);

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
    const { sqrtPriceX96 } = await poolContract.slot0();
    console.log(`sqrtPriceX96: ${sqrtPriceX96.toString()}`);
    if (sqrtPriceX96.eq(0)) {
      await (await poolContract.initialize(ethers.BigNumber.from(`79228162514243400000000000000`))).wait();
    }
    const params: Types.INonfungiblePositionManager.MintParamsStruct = {
      token0,
      token1,
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
      gasPrice,
    });
    const receipt = await tx.wait();
    console.log(`Liquidity added successfully`);
    return poolContract;
  }
}