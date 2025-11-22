// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1
pragma solidity 0.8.30;

/// @custom:license-url https://github.com/1inch/aqua-app-template/blob/main/LICENSES/Aqua-Source-1.1.txt
/// @custom:copyright © 2025 Degensoft Ltd

/**
 * @title IDualFlashLoanReceiver
 * @notice Interface for dual flash loan receivers
 * @dev Contracts receiving dual flash loans must implement this interface
 */
interface IDualFlashLoanReceiver {
    /**
     * @notice Called when a dual flash loan is executed
     * @param token0 The first token that was borrowed
     * @param token1 The second token that was borrowed
     * @param amount0 The amount of token0 that was borrowed
     * @param amount1 The amount of token1 that was borrowed
     * @param fee0 The fee that must be paid for token0
     * @param fee1 The fee that must be paid for token1
     * @param initiator The address that initiated the flash loan
     * @param params Arbitrary data passed by the initiator
     * @return success True if the operation was successful
     */
    function executeDualFlashLoan(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1,
        address initiator,
        bytes calldata params
    ) external returns (bool success);
}

