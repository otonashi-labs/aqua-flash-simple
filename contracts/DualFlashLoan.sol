// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAqua } from "@1inch/aqua/src/interfaces/IAqua.sol";
import { TransientLock, TransientLockLib } from "@1inch/aqua/src/libs/ReentrancyGuard.sol";
import { AquaApp } from "@1inch/aqua/src/AquaApp.sol";
import { IDualFlashLoanReceiver } from "./IDualFlashLoanReceiver.sol";

/**
 * @title DualFlashLoan
 * @notice Gas-optimized dual-token flash loan implementation using Aqua
 * @dev Allows users to borrow TWO tokens simultaneously from liquidity providers
 *      Optimized for Aqua's pair-based architecture using safeBalances()
 */
contract DualFlashLoan is AquaApp {
    using TransientLockLib for TransientLock;

    error DualFlashLoanFailed();
    error RepaymentFailed();
    error InvalidFee();
    error InvalidTokenOrder();

    struct Strategy {
        address maker;      // Liquidity provider
        address token0;     // First token to borrow (must be < token1)
        address token1;     // Second token to borrow (must be > token0)
        uint256 feeBps;     // Fee in basis points (e.g., 9 = 0.09%)
        bytes32 salt;       // Unique identifier
    }

    uint256 internal constant BPS_BASE = 10_000;
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% maximum fee

    event DualFlashLoanExecuted(
        address indexed maker,
        address indexed borrower,
        address indexed token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1
    );

    constructor(IAqua aqua_) AquaApp(aqua_) {}

    /**
     * @notice Calculate the fee for a flash loan amount
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
     * @notice Execute a dual flash loan for two tokens
     * @param strategy The flash loan strategy containing maker, tokens, fee
     * @param amount0 The amount of token0 to borrow
     * @param amount1 The amount of token1 to borrow
     * @param receiver The contract that will receive the callback
     * @param params Arbitrary data to pass to the receiver
     */
    function dualFlashLoan(
        Strategy calldata strategy,
        uint256 amount0,
        uint256 amount1,
        address receiver,
        bytes calldata params
    ) external nonReentrantStrategy(keccak256(abi.encode(strategy))) {
        // Enforce token ordering for consistency with Aqua's safeBalances
        if (strategy.token0 >= strategy.token1) revert InvalidTokenOrder();
        
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        
        // Calculate fees for both tokens
        uint256 fee0 = calculateFee(strategy, amount0);
        uint256 fee1 = calculateFee(strategy, amount1);
        uint256 repayAmount0 = amount0 + fee0;
        uint256 repayAmount1 = amount1 + fee1;

        // Check available balances using Aqua's optimized safeBalances for pairs
        (uint256 availableBalance0, uint256 availableBalance1) = AQUA.safeBalances(
            strategy.maker,
            address(this),
            strategyHash,
            strategy.token0,
            strategy.token1
        );
        require(availableBalance0 >= amount0, "Insufficient liquidity token0");
        require(availableBalance1 >= amount1, "Insufficient liquidity token1");

        // Get balances before pull
        uint256 balance0Before = IERC20(strategy.token0).balanceOf(receiver);
        uint256 balance1Before = IERC20(strategy.token1).balanceOf(receiver);

        // Pull both tokens from Aqua to receiver
        AQUA.pull(strategy.maker, strategyHash, strategy.token0, amount0, receiver);
        AQUA.pull(strategy.maker, strategyHash, strategy.token1, amount1, receiver);

        // Execute callback
        bool success = IDualFlashLoanReceiver(receiver).executeDualFlashLoan(
            strategy.token0,
            strategy.token1,
            amount0,
            amount1,
            fee0,
            fee1,
            msg.sender,
            params
        );
        if (!success) revert DualFlashLoanFailed();

        // Verify repayment - receiver must have transferred tokens back
        uint256 balance0After = IERC20(strategy.token0).balanceOf(receiver);
        uint256 balance1After = IERC20(strategy.token1).balanceOf(receiver);
        if (balance0After < balance0Before || balance1After < balance1Before) {
            revert RepaymentFailed();
        }

        // Transfer repayments from receiver to maker
        IERC20(strategy.token0).transferFrom(receiver, strategy.maker, repayAmount0);
        IERC20(strategy.token1).transferFrom(receiver, strategy.maker, repayAmount1);

        emit DualFlashLoanExecuted(
            strategy.maker,
            msg.sender,
            strategy.token0,
            strategy.token1,
            amount0,
            amount1,
            fee0,
            fee1
        );
    }

    /**
     * @notice Get the available liquidity for both tokens in a strategy
     * @param strategy The flash loan strategy
     * @return liquidity0 The available amount to borrow for token0
     * @return liquidity1 The available amount to borrow for token1
     */
    function getAvailableLiquidity(
        Strategy calldata strategy
    ) external view returns (uint256 liquidity0, uint256 liquidity1) {
        if (strategy.token0 >= strategy.token1) revert InvalidTokenOrder();
        
        bytes32 strategyHash = keccak256(abi.encode(strategy));
        (liquidity0, liquidity1) = AQUA.safeBalances(
            strategy.maker,
            address(this),
            strategyHash,
            strategy.token0,
            strategy.token1
        );
    }
}



