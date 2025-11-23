# Flash Loan Implementation

A simple, gas-optimized flash loan implementation using Aqua protocol.

## Overview

This implementation provides a blazingly simple flash loan mechanism that allows users to borrow tokens from liquidity providers with minimal gas overhead. It uses Aqua's native pull/push mechanism directly for optimal efficiency.

## Key Features

- ✅ **Simple & Gas Optimized**: Direct use of Aqua's pull/push without complex bytecode
- ✅ **Reentrancy Protected**: Built-in protection against reentrancy attacks
- ✅ **Flexible Fees**: Configurable fees up to 10% maximum
- ✅ **Multiple Strategies**: Support for multiple tokens and makers
- ✅ **Comprehensive Tests**: 23 passing tests covering all scenarios

## Architecture

### Core Contracts

1. **FlashLoan.sol** - Main flash loan contract
   - Extends `AquaApp` for Aqua integration
   - Manages flash loan execution and fee collection
   - Provides liquidity checking

2. **IFlashLoanReceiver.sol** - Interface for flash loan receivers
   - Contracts must implement `executeFlashLoan` callback
   - Receives borrowed tokens and must return them + fee

3. **FlashLoanExecutor.sol** - Helper/testing contract
   - Example implementation of flash loan receiver
   - Useful for testing and as a reference

4. **ReentrantFlashLoanAttacker.sol** - Reentrancy test contract
   - Used to verify reentrancy protection

## How It Works

### Flash Loan Flow

```
1. User calls flashLoan() with strategy, amount, receiver, and params
2. FlashLoan contract pulls tokens from Aqua to receiver
3. FlashLoan contract calls receiver.executeFlashLoan()
4. Receiver uses tokens for arbitrary logic
5. Receiver approves repayment (amount + fee)
6. FlashLoan contract transfers repayment from receiver to maker
7. Event emitted
```

### Strategy Structure

```solidity
struct Strategy {
    address maker;      // Liquidity provider
    address token;      // Token to borrow
    uint256 feeBps;     // Fee in basis points (e.g., 9 = 0.09%)
    bytes32 salt;       // Unique identifier
}
```

## Gas Optimizations

- Direct Aqua pull/push (no bytecode building)
- Minimal storage usage (transient storage for reentrancy)
- Single token transfers (no multi-token overhead)
- Efficient struct packing

## Usage Example

### 1. Deploy Contracts

```bash
yarn build
```

### 2. Create Flash Loan Strategy

```typescript
const strategy = {
  maker: makerAddress,
  token: tokenAddress,
  feeBps: 9, // 0.09% fee
  salt: ethers.ZeroHash
};

// Ship liquidity to Aqua
const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
  ['tuple(address,address,uint256,bytes32)'],
  [[strategy.maker, strategy.token, strategy.feeBps, strategy.salt]]
);

await aqua.connect(maker).ship(
  flashLoanAddress,
  encodedStrategy,
  [tokenAddress],
  [liquidityAmount]
);
```

### 3. Implement Receiver Contract

```solidity
contract MyFlashLoanReceiver is IFlashLoanReceiver {
    function executeFlashLoan(
        address token,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Your arbitrage/liquidation/etc logic here
        
        // Approve repayment
        uint256 repayAmount = amount + fee;
        IERC20(token).approve(msg.sender, repayAmount);
        
        return true;
    }
}
```

### 4. Execute Flash Loan

```typescript
await flashLoan.flashLoan(
  strategy,
  borrowAmount,
  receiverAddress,
  params
);
```

## Security Features

### Reentrancy Protection

Uses Aqua's `nonReentrantStrategy` modifier with transient storage:
- Prevents nested flash loans on same strategy
- No storage gas overhead between transactions
- Automatic cleanup

### Balance Verification

- Checks available liquidity before pull
- Verifies receiver balance after callback
- Ensures repayment amount is correct

### Fee Validation

- Maximum fee capped at 10% (MAX_FEE_BPS)
- Fee calculated in basis points for precision
- Reverts if fee exceeds maximum

## Testing

Run comprehensive test suite:

```bash
yarn test test/FlashLoan.test.ts
```

### Test Coverage

- ✅ Deployment and initialization
- ✅ Fee calculations (0%, normal, max)
- ✅ Available liquidity queries
- ✅ Successful flash loan execution
- ✅ Multiple sequential loans
- ✅ Different borrowers
- ✅ Insufficient liquidity handling
- ✅ Failed callback handling
- ✅ Repayment failures
- ✅ Reentrancy attack prevention
- ✅ Edge cases (1 wei, max liquidity)
- ✅ Multiple tokens/strategies
- ✅ Liquidity management (dock)

All 23 tests pass ✅

## Why This Approach

| Feature | This Implementation |
|---------|---------------------|
| Gas Cost | **79,144 gas** (measured on-chain) |
| Code Lines | ~130 lines |
| Dependencies | Aqua only |
| Bytecode Build | No - direct calls |
| Callback Type | Direct interface |
| Reentrancy | Transient storage (EIP-1153) |
| Complexity | Minimal - easy to audit |

**Note on SwapVM:** SwapVM is designed for swap operations where `tokenIn ≠ tokenOut`. Flash loans require `tokenBorrowed = tokenReturned` (same token), making SwapVM unsuitable due to the `MakerTraitsTokenInAndTokenOutMustBeDifferent()` constraint.

## Events

```solidity
event FlashLoanExecuted(
    address indexed maker,
    address indexed borrower,
    address indexed token,
    uint256 amount,
    uint256 fee
);
```

## Error Codes

- `FlashLoanFailed()` - Callback returned false
- `RepaymentFailed()` - Balance check failed after callback
- `InvalidFee()` - Fee exceeds MAX_FEE_BPS

## Integration with XYCSwap

This flash loan implementation works alongside the existing XYCSwap AMM:
- Both use Aqua as the underlying protocol
- Share the same liquidity infrastructure
- Can be used together for complex strategies
- Independent strategy management

## Future Enhancements

Possible improvements (not implemented for simplicity):
- Multi-token flash loans
- Flash loan batching
- Dynamic fee adjustment
- Protocol fee collection
- Emergency pause mechanism

## License

See LICENSE file - Aqua Source License 1.1

