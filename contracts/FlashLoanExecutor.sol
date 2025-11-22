// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IFlashLoanReceiver } from "./IFlashLoanReceiver.sol";
import { FlashLoan } from "./FlashLoan.sol";

/**
 * @title FlashLoanExecutor
 * @notice Helper contract for testing flash loans
 * @dev Implements the IFlashLoanReceiver interface
 */
contract FlashLoanExecutor is IFlashLoanReceiver {
    
    address public owner;
    bool public shouldSucceed = true;
    bool public shouldRepay = true;

    event FlashLoanReceived(
        address token,
        uint256 amount,
        uint256 fee,
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
     * @notice Execute a flash loan
     * @param flashLoan The FlashLoan contract
     * @param strategy The flash loan strategy
     * @param amount The amount to borrow
     * @param params Arbitrary parameters
     */
    function executeFlashLoan(
        FlashLoan flashLoan,
        FlashLoan.Strategy calldata strategy,
        uint256 amount,
        bytes calldata params
    ) external onlyOwner {
        flashLoan.flashLoan(strategy, amount, address(this), params);
    }

    /**
     * @notice Callback function called by FlashLoan contract
     * @param token The borrowed token
     * @param amount The borrowed amount
     * @param fee The fee to pay
     * @param initiator The address that initiated the loan
     * @return success Whether the operation succeeded
     */
    function executeFlashLoan(
        address token,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata /* params */
    ) external override returns (bool success) {
        emit FlashLoanReceived(token, amount, fee, initiator);

        // Verify we received the tokens
        require(
            IERC20(token).balanceOf(address(this)) >= amount,
            "Did not receive tokens"
        );

        // If shouldRepay is true, approve the repayment
        if (shouldRepay) {
            uint256 repayAmount = amount + fee;
            IERC20(token).approve(msg.sender, repayAmount);
        }

        return shouldSucceed;
    }

    /**
     * @notice Configure executor behavior for testing
     * @param _shouldSucceed Whether executeFlashLoan should return true
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

