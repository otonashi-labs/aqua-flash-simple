// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IFlashLoanReceiver } from "./IFlashLoanReceiver.sol";
import { FlashLoan } from "./FlashLoan.sol";

/**
 * @title ReentrantFlashLoanAttacker
 * @notice Test contract that attempts to reenter the flash loan
 * @dev Used for testing reentrancy protection
 */
contract ReentrantFlashLoanAttacker is IFlashLoanReceiver {
    
    FlashLoan public immutable flashLoan;
    bool private attacking;

    constructor(address _flashLoan) {
        flashLoan = FlashLoan(_flashLoan);
    }

    function attack(
        FlashLoan.Strategy calldata strategy,
        uint256 amount
    ) external {
        attacking = true;
        flashLoan.flashLoan(strategy, amount, address(this), "0x");
    }

    function executeFlashLoan(
        address token,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata /* params */
    ) external override returns (bool) {
        if (attacking) {
            // Try to reenter
            FlashLoan.Strategy memory strategy = FlashLoan.Strategy({
                maker: initiator,
                token: token,
                feeBps: 9,
                salt: bytes32(0)
            });
            
            // This should fail due to reentrancy guard
            flashLoan.flashLoan(strategy, amount / 2, address(this), "0x");
        }

        // Approve repayment
        uint256 repayAmount = amount + fee;
        IERC20(token).approve(msg.sender, repayAmount);
        
        return true;
    }
}

