// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAqua } from "@1inch/aqua/src/interfaces/IAqua.sol";
import { TransientLock, TransientLockLib } from "@1inch/aqua/src/libs/ReentrancyGuard.sol";
import { AquaApp } from "@1inch/aqua/src/AquaApp.sol";
import { IFlashLoanReceiver } from "./IFlashLoanReceiver.sol";

/**
 * @title FlashLoan
 * @notice Simple, gas-optimized flash loan implementation using Aqua
 * @dev Allows users to borrow tokens from liquidity providers with a fee
 */
contract FlashLoan is AquaApp {
    using TransientLockLib for TransientLock;

    error FlashLoanFailed();
    error RepaymentFailed();
    error InvalidFee();

    struct Strategy {
        address maker;      // Liquidity provider
        address token;      // Token to borrow
        uint256 feeBps;     // Fee in basis points (e.g., 9 = 0.09%)
        bytes32 salt;       // Unique identifier
    }

    uint256 internal constant BPS_BASE = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% maximum fee

    event FlashLoanExecuted(
        address indexed maker,
        address indexed borrower,
        address indexed token,
        uint256 amount,
        uint256 fee
    );

    constructor(IAqua aqua_) AquaApp(aqua_) {}

    /**
     * @notice Calculate the fee for a flash loan
     * @param strategy The flash loan strategy
     * @param amount The amount to borrow
     * @return fee The fee amount
     */
    function calculateFee(
        Strategy calldata strategy,
        uint256 amount
    ) public pure returns (uint256 fee) {
        if (strategy.feeBps > MAX_FEE_BPS) revert InvalidFee();
        fee = (amount * strategy.feeBps) / BPS_BASE;
    }

    /**
     * @notice Execute a flash loan
     * @param strategy The flash loan strategy containing maker, token, fee
     * @param amount The amount to borrow
     * @param receiver The contract that will receive the callback
     * @param params Arbitrary data to pass to the receiver
     */
    function flashLoan(
        Strategy calldata strategy,
        uint256 amount,
        address receiver,
        bytes calldata params
    ) external nonReentrantStrategy(keccak256(abi.encode(strategy))) {
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        
        // Calculate fee
        uint256 fee = calculateFee(strategy, amount);
        uint256 repayAmount = amount + fee;

        // Check available balance
        (uint256 availableBalance,) = AQUA.safeBalances(
            strategy.maker,
            address(this),
            strategyHash,
            strategy.token,
            strategy.token
        );
        require(availableBalance >= amount, "Insufficient liquidity");

        // Get balance before pull
        uint256 balanceBefore = IERC20(strategy.token).balanceOf(receiver);

        // Pull tokens from Aqua to receiver
        AQUA.pull(strategy.maker, strategyHash, strategy.token, amount, receiver);

        // Execute callback
        bool success = IFlashLoanReceiver(receiver).executeFlashLoan(
            strategy.token,
            amount,
            fee,
            msg.sender,
            params
        );
        if (!success) revert FlashLoanFailed();

        // Verify repayment - receiver must transfer tokens back
        uint256 balanceAfter = IERC20(strategy.token).balanceOf(receiver);
        if (balanceAfter < balanceBefore) revert RepaymentFailed();

        // Transfer repayment from receiver to maker
        IERC20(strategy.token).transferFrom(receiver, strategy.maker, repayAmount);

        emit FlashLoanExecuted(
            strategy.maker,
            msg.sender,
            strategy.token,
            amount,
            fee
        );
    }

    /**
     * @notice Get the available liquidity for a strategy
     * @param strategy The flash loan strategy
     * @return liquidity The available amount to borrow
     */
    function getAvailableLiquidity(
        Strategy calldata strategy
    ) external view returns (uint256 liquidity) {
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        (liquidity,) = AQUA.safeBalances(
            strategy.maker,
            address(this),
            strategyHash,
            strategy.token,
            strategy.token
        );
    }
}

