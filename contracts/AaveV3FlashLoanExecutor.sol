// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IFlashLoanSimpleReceiver } from "./IFlashLoanSimpleReceiver.sol";
import { IAaveV3Pool } from "./IAaveV3Pool.sol";

/**
 * @title AaveV3FlashLoanExecutor
 * @notice Minimal Aave V3 flash loan executor for gas comparison
 * @dev Implements the IFlashLoanSimpleReceiver interface for Aave V3
 */
contract AaveV3FlashLoanExecutor is IFlashLoanSimpleReceiver {
    
    address public immutable owner;
    address public immutable poolAddress;
    
    event FlashLoanReceived(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator
    );

    error NotOwner();
    error NotPool();
    error InsufficientBalance();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyPool() {
        if (msg.sender != poolAddress) revert NotPool();
        _;
    }

    /**
     * @notice Constructor
     * @param _poolAddress The address of the Aave V3 Pool
     */
    constructor(address _poolAddress) {
        owner = msg.sender;
        poolAddress = _poolAddress;
    }

    /**
     * @notice Execute a flash loan via Aave V3
     * @param asset The address of the asset to borrow
     * @param amount The amount to borrow
     * @param params Arbitrary parameters to pass to the callback
     */
    function executeFlashLoan(
        address asset,
        uint256 amount,
        bytes calldata params
    ) external onlyOwner {
        IAaveV3Pool(poolAddress).flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            0 // referralCode
        );
    }

    /**
     * @notice Callback function called by Aave V3 Pool
     * @param asset The address of the flash-borrowed asset
     * @param amount The amount of the flash-borrowed asset
     * @param premium The fee of the flash-borrowed asset
     * @param initiator The address of the flashloan initiator
     * @param params The byte-encoded params passed when initiating the flashloan
     * @return True if the execution of the operation succeeds
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override onlyPool returns (bool) {
        emit FlashLoanReceived(asset, amount, premium, initiator);

        // Verify we received the tokens
        uint256 balance = IERC20(asset).balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        // Calculate repayment amount
        uint256 repayAmount = amount + premium;

        // Approve the pool to pull the repayment
        IERC20(asset).approve(poolAddress, repayAmount);

        return true;
    }

    /**
     * @notice Withdraw tokens from this contract
     * @param token The token to withdraw
     * @param to The recipient
     * @param amount The amount to withdraw
     */
    function withdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }

    /**
     * @notice Get the pool address
     * @return The Aave V3 Pool address
     */
    function getPoolAddress() external view returns (address) {
        return poolAddress;
    }
}

