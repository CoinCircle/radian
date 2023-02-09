// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPaymaster, ExecutionResult} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import {IERC20} from "@matterlabs/zksync-contracts/l2/system-contracts/openzeppelin/token/ERC20/IERC20.sol";

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import {IExchangePool} from "../exchange/interfaces/IExchangePool.sol";
import {IExchangePoolFactory} from "../exchange/interfaces/IExchangePoolFactory.sol";
import {ISwapRouter} from "../exchange/periphery/interfaces/ISwapRouter.sol";
import {TransferHelper} from "../exchange/periphery/libraries/TransferHelper.sol";


contract RadianPaymaster is IPaymaster {
    uint256 constant PRICE_FOR_PAYING_FEES = 1;
    address WETH_ADDRESS;
    address constant RADIAN_COLLECTOR_ADDRESS = address(0);
    address UNISWAP_V3_FACTORY_ADDRESS;
    address SWAP_ROUTER_ADDRESS;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continure execution if called from the bootloader.
        _;
    }

    constructor(
      address _uniswapV3FactoryAddress,
      address _swapRouterAddress,
      address _wethAddress
    ) {
        UNISWAP_V3_FACTORY_ADDRESS = _uniswapV3FactoryAddress;
        SWAP_ROUTER_ADDRESS = _swapRouterAddress;
        WETH_ADDRESS = _wethAddress;
    }

    /**
     * @dev Checks if the token is allowed to be used as a fee.
     */
    function isAllowedToken(address _erc20) public view returns (bool) {
      (address poolAddress, ) = getPoolAddress(_erc20);
      return poolAddress != address(0);
    }

    function getPoolAddress(address _erc20) public view returns (address, uint24) {
      // Sort
      (address token0, address token1) = _erc20 < WETH_ADDRESS ? (_erc20, WETH_ADDRESS) : (WETH_ADDRESS, _erc20);
      IExchangePoolFactory uniswapV3Factory = IExchangePoolFactory(UNISWAP_V3_FACTORY_ADDRESS);
      address addr3000 = uniswapV3Factory.getPool(token0, token1, 3000);
      if (addr3000 != address(0)) {
        return (addr3000, 3000);
      }
      address addr500 = uniswapV3Factory.getPool(token0, token1, 500);
      if (addr500 != address(0)) {
        return (addr500, 500);
      }
      address addr100 = uniswapV3Factory.getPool(token0, token1, 100);
      if (addr100 != address(0)) {
        return (addr100, 100);
      }
      return (address(0), 0);
    }

    function validateAndPayForPaymasterTransaction(
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override onlyBootloader returns (bytes4 magic, bytes memory context) {
        require(
            _transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long"
        );

        bytes4 paymasterInputSelector = bytes4(
            _transaction.paymasterInput[0:4]
        );
        if (paymasterInputSelector == IPaymasterFlow.approvalBased.selector) {
            (address token, uint256 minAllowance, bytes memory data) = abi
                .decode(
                    _transaction.paymasterInput[4:],
                    (address, uint256, bytes)
                );

            require(minAllowance >= 1, "Min allowance too low");
            require(isAllowedToken(token), "Invalid token");

            address userAddress = address(uint160(_transaction.from));
            address thisAddress = address(this);
            // Note, that while the minimal amount of ETH needed is tx.ergsPrice * tx.ergsLimit,
            // neither paymaster nor account are allowed to access this context variable.
            uint256 requiredETH = _transaction.gasLimit *
                _transaction.maxFeePerGas;

            uint256 providedAllowance = IERC20(token).allowance(
                userAddress,
                thisAddress
            );
            // The client is responsible for computing the amountInMax.
            (address poolAddress, uint24 poolFee) = getPoolAddress(token);
            IExchangePool pool = IExchangePool(poolAddress);

            // @TODO decide if we should even check this sort of thing, rather
            // than just allowing the uniswap swap to fail if the user doesn't
            // have enough tokens.
            require(
                providedAllowance >= PRICE_FOR_PAYING_FEES,
                "The user did not provide enough allowance"
            );

            // Execute the swap

            // Pulling all the tokens from the user
            uint256 amountInMaximum = providedAllowance;
            IERC20(token).transferFrom(userAddress, thisAddress, providedAllowance);
            // Approve the router to spend DAI.
            // TransferHelper.safeApprove(token, SWAP_ROUTER_ADDRESS, amountInMaximum);
            // ISwapRouter.ExactOutputSingleParams memory params =
            // ISwapRouter.ExactOutputSingleParams({
            //     tokenIn: token,
            //     tokenOut: WETH_ADDRESS,
            //     fee: poolFee,
            //     recipient: msg.sender,
            //     deadline: block.timestamp,
            //     amountOut: requiredETH,
            //     amountInMaximum: amountInMaximum,
            //     sqrtPriceLimitX96: 0
            // });
            // ISwapRouter swapRouter = ISwapRouter(SWAP_ROUTER_ADDRESS);
            // // Executes the swap returning the amountIn needed to spend to receive the desired amountOut.
            // uint256 amountIn = swapRouter.exactOutputSingle(params);

            // For exact output swaps, the amountInMaximum may not have all been spent.
            // If the actual amount spent (amountIn) is less than the specified maximum amount, we must refund the msg.sender and approve the swapRouter to spend 0.
            // if (amountIn < amountInMaximum) {
            //     TransferHelper.safeApprove(token, SWAP_ROUTER_ADDRESS, 0);
            //     // send change to the user
            //     // TransferHelper.safeTransfer(token, msg.sender, amountInMaximum - amountIn);
            //     // send change to collector
            //     TransferHelper.safeTransfer(token, RADIAN_COLLECTOR_ADDRESS, amountInMaximum - amountIn);
            // }
            // TransferHelper.safeTransfer(token, RADIAN_COLLECTOR_ADDRESS, amountInMaximum);
            IERC20(token).transferFrom(thisAddress, RADIAN_COLLECTOR_ADDRESS, amountInMaximum);
            // The bootloader never returns any data, so it can safely be ignored here.
            (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{
                value: requiredETH
            }("");
            require(success, "Failed to transfer funds to the bootloader");
            magic = IPaymaster.validateAndPayForPaymasterTransaction.selector;
        } else {
            revert("Unsupported paymaster flow");
        }
    }

    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32 _txHash,
        bytes32 _suggestedSignedHash,
        ExecutionResult _txResult,
        uint256 _maxRefundedErgs
    ) external payable onlyBootloader {
        // This contract does not support any refunding logic
    }

    receive() external payable {}
}