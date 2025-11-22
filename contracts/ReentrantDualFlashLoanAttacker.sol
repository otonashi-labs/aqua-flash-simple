// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IDualFlashLoanReceiver } from "./IDualFlashLoanReceiver.sol";
import { DualFlashLoan } from "./DualFlashLoan.sol";

/**
 * @title ReentrantDualFlashLoanAttacker
 * @notice Malicious contract that attempts reentrancy attack on DualFlashLoan
 * @dev Used for testing reentrancy protection
 */
contract ReentrantDualFlashLoanAttacker is IDualFlashLoanReceiver {
    
    DualFlashLoan public immutable flashLoan;
    DualFlashLoan.Strategy public attackStrategy;
    uint256 public attackAmount0;
    uint256 public attackAmount1;
    bool private attacking;

    constructor(DualFlashLoan _flashLoan) {
        flashLoan = _flashLoan;
    }

    /**
     * @notice Initiate the reentrancy attack
     * @param strategy The flash loan strategy to attack
     * @param amount0 Amount of token0 to borrow
     * @param amount1 Amount of token1 to borrow
     */
    function attack(
        DualFlashLoan.Strategy calldata strategy,
        uint256 amount0,
        uint256 amount1
    ) external {
        attackStrategy = strategy;
        attackAmount0 = amount0;
        attackAmount1 = amount1;
        attacking = true;
        
        flashLoan.dualFlashLoan(strategy, amount0, amount1, address(this), "");
    }

    /**
     * @notice Callback that attempts reentrancy
     */
    function executeDualFlashLoan(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1,
        address /* initiator */,
        bytes calldata /* params */
    ) external override returns (bool) {
        if (attacking) {
            attacking = false;
            // Attempt to reenter - this should fail
            flashLoan.dualFlashLoan(attackStrategy, attackAmount0, attackAmount1, address(this), "");
        }

        // Approve repayment
        uint256 repayAmount0 = amount0 + fee0;
        uint256 repayAmount1 = amount1 + fee1;
        IERC20(token0).approve(msg.sender, repayAmount0);
        IERC20(token1).approve(msg.sender, repayAmount1);

        return true;
    }
}

