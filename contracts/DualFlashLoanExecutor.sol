// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IDualFlashLoanReceiver } from "./IDualFlashLoanReceiver.sol";
import { DualFlashLoan } from "./DualFlashLoan.sol";

/**
 * @title DualFlashLoanExecutor
 * @notice Helper contract for testing dual flash loans
 * @dev Implements the IDualFlashLoanReceiver interface
 */
contract DualFlashLoanExecutor is IDualFlashLoanReceiver {
    
    address public owner;
    bool public shouldSucceed = true;
    bool public shouldRepay = true;

    event DualFlashLoanReceived(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1,
        address initiator
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Execute a dual flash loan
     * @param flashLoan The DualFlashLoan contract
     * @param strategy The flash loan strategy
     * @param amount0 The amount of token0 to borrow
     * @param amount1 The amount of token1 to borrow
     * @param params Arbitrary parameters
     */
    function executeDualFlashLoan(
        DualFlashLoan flashLoan,
        DualFlashLoan.Strategy calldata strategy,
        uint256 amount0,
        uint256 amount1,
        bytes calldata params
    ) external onlyOwner {
        flashLoan.dualFlashLoan(strategy, amount0, amount1, address(this), params);
    }

    /**
     * @notice Callback function called by DualFlashLoan contract
     * @param token0 The first borrowed token
     * @param token1 The second borrowed token
     * @param amount0 The first borrowed amount
     * @param amount1 The second borrowed amount
     * @param fee0 The fee for token0
     * @param fee1 The fee for token1
     * @param initiator The address that initiated the loan
     * @return success Whether the operation succeeded
     */
    function executeDualFlashLoan(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1,
        address initiator,
        bytes calldata /* params */
    ) external override returns (bool success) {
        emit DualFlashLoanReceived(token0, token1, amount0, amount1, fee0, fee1, initiator);

        // Verify we received both tokens
        require(
            IERC20(token0).balanceOf(address(this)) >= amount0,
            "Did not receive token0"
        );
        require(
            IERC20(token1).balanceOf(address(this)) >= amount1,
            "Did not receive token1"
        );

        // If shouldRepay is true, approve the repayments
        if (shouldRepay) {
            uint256 repayAmount0 = amount0 + fee0;
            uint256 repayAmount1 = amount1 + fee1;
            IERC20(token0).approve(msg.sender, repayAmount0);
            IERC20(token1).approve(msg.sender, repayAmount1);
        }

        return shouldSucceed;
    }

    /**
     * @notice Configure executor behavior for testing
     * @param _shouldSucceed Whether executeDualFlashLoan should return true
     * @param _shouldRepay Whether to approve repayment
     */
    function configure(bool _shouldSucceed, bool _shouldRepay) external onlyOwner {
        shouldSucceed = _shouldSucceed;
        shouldRepay = _shouldRepay;
    }

    /**
     * @notice Withdraw tokens from this contract
     * @param token The token to withdraw
     * @param to The recipient
     * @param amount The amount to withdraw
     */
    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}

