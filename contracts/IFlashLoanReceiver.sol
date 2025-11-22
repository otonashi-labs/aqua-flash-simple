// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

/**
 * @title IFlashLoanReceiver
 * @notice Interface for flash loan receivers
 * @dev Contracts receiving flash loans must implement this interface
 */
interface IFlashLoanReceiver {
    /**
     * @notice Called when a flash loan is executed
     * @param token The token that was borrowed
     * @param amount The amount that was borrowed
     * @param fee The fee that must be paid
     * @param initiator The address that initiated the flash loan
     * @param params Arbitrary data passed by the initiator
     * @return success True if the operation was successful
     */
    function executeFlashLoan(
        address token,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata params
    ) external returns (bool success);
}

