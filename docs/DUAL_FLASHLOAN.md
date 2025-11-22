# Dual Flash Loan Implementation

A gas-optimized dual-token flash loan implementation using Aqua protocol's pair-based architecture.

## Live on Sepolia

**DualFlashLoan**: [`0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8`](https://sepolia.etherscan.io/address/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8#code)  
**DualFlashLoanExecutor**: [`0xfe2D77D038e05B8de20adb15b05a894AF00081a0`](https://sepolia.etherscan.io/address/0xfe2D77D038e05B8de20adb15b05a894AF00081a0#code)

**On-Chain Proof**: [Live TX](https://sepolia.etherscan.io/tx/0x45bed7f1b7cb978f503697f2909bea04b2f829e280436a3d5afe6c10b2c5c44c) - Gas: **128,207** ✅

## Overview

`DualFlashLoan` allows users to borrow **TWO tokens simultaneously** from liquidity providers in a single transaction. This is optimized for Aqua's swap engine design, which is built around token pairs using the `safeBalances()` function.

## Key Features

- ✅ **Dual-Token Support**: Borrow two tokens in one flash loan transaction
- ✅ **Gas Optimized**: Uses Aqua's `safeBalances()` for efficient pair-based balance checking
- ✅ **No Arrays**: Cleaner implementation without array overhead
- ✅ **Reentrancy Protected**: Built-in protection against reentrancy attacks
- ✅ **Flexible Fees**: Configurable fees up to 10% maximum
- ✅ **Perfect for Arbitrage**: Ideal for triangular arbitrage and cross-DEX strategies

## Why Dual Flash Loan?

### Aqua's Pair-Based Architecture

Aqua is designed as a **swap engine** - swaps happen between exactly two tokens. The core `safeBalances()` function reflects this:

```solidity
function safeBalances(
    address maker,
    address app,
    bytes32 strategyHash,
    address token0,
    address token1
) external view returns (uint256 balance0, uint256 balance1);
```

### Benefits Over Batch Flash Loans

1. **Native Aqua Integration**: Uses `safeBalances()` designed for pairs
2. **Lower Gas Costs**: No array iteration, direct token access
3. **Simpler Code**: Clearer logic without array handling
4. **Better Type Safety**: Explicit token0/token1 parameters

### Use Cases

- **Triangular Arbitrage**: Borrow USDC + WETH, swap through multiple DEXs, repay with profit
- **Cross-DEX Arbitrage**: Execute price differences across Uniswap, SushiSwap, etc.
- **Liquidations**: Borrow collateral + debt tokens to execute complex liquidations
- **Yield Farming**: Rebalance positions across multiple pools

## Architecture

### Core Contracts

1. **DualFlashLoan.sol** - Main dual flash loan contract
   - Extends `AquaApp` for Aqua integration
   - Manages dual flash loan execution and fee collection
   - Provides liquidity checking for both tokens

2. **IDualFlashLoanReceiver.sol** - Interface for dual flash loan receivers
   - Contracts must implement `executeDualFlashLoan` callback
   - Receives both borrowed tokens and must return them + fees

3. **DualFlashLoanExecutor.sol** - Helper/testing contract
   - Example implementation of dual flash loan receiver
   - Useful for testing and as a reference

4. **ReentrantDualFlashLoanAttacker.sol** - Reentrancy test contract
   - Used to verify reentrancy protection

## How It Works

### Dual Flash Loan Flow

```
1. User calls dualFlashLoan() with strategy, amounts, receiver, and params
2. DualFlashLoan contract validates token ordering (token0 < token1)
3. DualFlashLoan contract checks available liquidity for both tokens
4. DualFlashLoan pulls token0 from Aqua to receiver
5. DualFlashLoan pulls token1 from Aqua to receiver
6. DualFlashLoan calls receiver.executeDualFlashLoan()
7. Receiver uses tokens for arbitrary logic (arbitrage, etc.)
8. Receiver approves repayment (amount + fee) for both tokens
9. DualFlashLoan transfers repayments from receiver to maker
10. Event emitted
```

### Strategy Structure

```solidity
struct Strategy {
    address maker;      // Liquidity provider
    address token0;     // First token (must be < token1)
    address token1;     // Second token (must be > token0)
    uint256 feeBps;     // Fee in basis points (e.g., 9 = 0.09%)
    bytes32 salt;       // Unique identifier
}
```

**Important**: Tokens must be ordered (`token0 < token1`) for consistency with Aqua's `safeBalances()`.

## Gas Optimizations

- Direct Aqua `safeBalances()` call for pairs (single call, two balances)
- No array iteration or dynamic memory allocation
- Minimal storage usage (transient storage for reentrancy)
- Two sequential token transfers (pull for each token)
- Efficient struct packing

## Usage Example

### 1. Deploy Contracts

```bash
yarn build
```

### 2. Create Dual Flash Loan Strategy

```typescript
// Ensure token0 < token1 by address
const [token0Address, token1Address] = 
  tokenAAddress < tokenBAddress 
    ? [tokenAAddress, tokenBAddress]
    : [tokenBAddress, tokenAAddress];

const strategy = {
  maker: makerAddress,
  token0: token0Address,
  token1: token1Address,
  feeBps: 9, // 0.09% fee
  salt: ethers.ZeroHash
};

// Ship liquidity to Aqua
const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
  ['tuple(address,address,address,uint256,bytes32)'],
  [[strategy.maker, strategy.token0, strategy.token1, strategy.feeBps, strategy.salt]]
);

await aqua.connect(maker).ship(
  dualFlashLoanAddress,
  encodedStrategy,
  [token0Address, token1Address],
  [liquidity0Amount, liquidity1Amount]
);
```

### 3. Implement Receiver Contract

```solidity
contract MyDualFlashLoanReceiver is IDualFlashLoanReceiver {
    function executeDualFlashLoan(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Your arbitrage/liquidation/etc logic here
        // Example: Triangular arbitrage
        // 1. Swap token0 for tokenX on DEX1
        // 2. Swap tokenX for token1 on DEX2
        // 3. You now have enough to repay + profit
        
        // Approve repayments
        uint256 repayAmount0 = amount0 + fee0;
        uint256 repayAmount1 = amount1 + fee1;
        IERC20(token0).approve(msg.sender, repayAmount0);
        IERC20(token1).approve(msg.sender, repayAmount1);
        
        return true;
    }
}
```

### 4. Execute Dual Flash Loan

```typescript
await dualFlashLoan.dualFlashLoan(
  strategy,
  borrowAmount0,
  borrowAmount1,
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

- Checks available liquidity for both tokens before pull
- Verifies receiver balance after callback for both tokens
- Ensures repayment amounts are correct

### Token Ordering Validation

- Enforces `token0 < token1` to match Aqua's `safeBalances()` expectations
- Prevents strategy confusion and errors
- Consistent with Uniswap-style pair ordering

### Fee Validation

- Maximum fee capped at 10% (MAX_FEE_BPS)
- Fee calculated in basis points for precision
- Reverts if fee exceeds maximum

## Testing

Run comprehensive test suite:

```bash
yarn test test/DualFlashLoan.test.ts
```

### Test Coverage

- ✅ Deployment and initialization
- ✅ Fee calculations (0%, normal, max)
- ✅ Available liquidity queries
- ✅ Successful dual flash loan execution
- ✅ Multiple sequential loans
- ✅ Asymmetric borrow amounts (different amounts for each token)
- ✅ Single token borrowing (zero amount for one token)
- ✅ Insufficient liquidity handling (both tokens)
- ✅ Failed callback handling
- ✅ Repayment failures
- ✅ Reentrancy attack prevention
- ✅ Token ordering validation
- ✅ Edge cases (1 wei, max liquidity)
- ✅ Liquidity management (dock)
- ✅ Gas benchmarking

## Gas Measurements

**On-Chain Verified Results** (Sepolia):
- **Dual Flash Loan Execution**: **128,207 gas** ⚡
- **Asymmetric Borrowing**: **128,197 gas**
- **Sequential 2x Single Flash Loans**: ~200,000 gas

**Savings**: **71,793 gas (36%)** compared to sequential flash loans

**Real Transaction**: [0x45bed7f1b7cb978f503697f2909bea04b2f829e280436a3d5afe6c10b2c5c44c](https://sepolia.etherscan.io/tx/0x45bed7f1b7cb978f503697f2909bea04b2f829e280436a3d5afe6c10b2c5c44c)

## Comparison: Single vs Dual Flash Loan

| Feature | Single FlashLoan | DualFlashLoan |
|---------|-----------------|---------------|
| Tokens per loan | 1 | 2 |
| Gas Cost | ~95k | **128k** |
| Sequential (2 tokens) | ~200k | N/A |
| Savings vs Sequential | - | **36%** |
| Balance check | rawBalances | safeBalances (optimized) |
| Aqua integration | Good | Optimal (pair-based) |
| Callback complexity | Simple | Medium |
| Use case | Single asset arb | Multi-asset arb |

## Events

```solidity
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
```

## Error Codes

- `DualFlashLoanFailed()` - Callback returned false
- `RepaymentFailed()` - Balance check failed after callback
- `InvalidFee()` - Fee exceeds MAX_FEE_BPS
- `InvalidTokenOrder()` - token0 >= token1 (must be token0 < token1)

## Advanced Usage

### Asymmetric Borrowing

Borrow different amounts of each token:

```typescript
await dualFlashLoan.dualFlashLoan(
  strategy,
  ether('100'),  // 100 token0
  ether('500'),  // 500 token1
  receiverAddress,
  params
);
```

### Single Token Borrowing

Borrow only one token by setting the other amount to 0:

```typescript
// Borrow only token0
await dualFlashLoan.dualFlashLoan(
  strategy,
  ether('100'),  // 100 token0
  0n,            // 0 token1
  receiverAddress,
  params
);
```

### Composing Multiple Dual Flash Loans

For strategies requiring more than 2 tokens:

```typescript
// Execute two dual flash loans in sequence
await dualFlashLoan1.dualFlashLoan(strategy1, amount0, amount1, receiver1, params1);
await dualFlashLoan2.dualFlashLoan(strategy2, amount2, amount3, receiver2, params2);

// Or use nested callbacks for atomic execution
```

## Integration with Aqua Ecosystem

This dual flash loan implementation works alongside:
- **XYCSwap**: Aqua-based AMM for swaps
- **FlashLoan**: Single-token flash loans
- **Custom Aqua Apps**: Any AquaApp can share the same liquidity

All use Aqua as the underlying protocol and share liquidity infrastructure.

## Best Practices

1. **Always Order Tokens**: Ensure `token0 < token1` before creating strategies
2. **Check Liquidity**: Query `getAvailableLiquidity()` before borrowing
3. **Handle Zero Amounts**: Your receiver should handle cases where amount0 or amount1 is 0
4. **Gas Optimization**: Minimize operations in the callback to save gas
5. **Repayment Safety**: Always ensure you have enough tokens + fees before calling
6. **Test Thoroughly**: Use DualFlashLoanExecutor as a reference implementation

## Deployment

**Already Live on Sepolia** ✅

Deploy to other networks using:

```bash
npx hardhat deploy --network sepolia --tags DualFlashLoan
```

**Sepolia Addresses:**
- Aqua: `0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF`
- DualFlashLoan: `0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8`
- DualFlashLoanExecutor: `0xfe2D77D038e05B8de20adb15b05a894AF00081a0`

## Future Enhancements

Possible improvements (not implemented for simplicity):
- Dynamic fee adjustment per token
- Protocol fee collection (different for each token)
- Emergency pause mechanism
- Maker hooks for custom logic
- Flash loan routing (compose multiple strategies)

## Why Not Batch Flash Loan (3+ tokens)?

While technically possible, batch flash loans would:
- Not leverage Aqua's optimized `safeBalances()` for pairs
- Require array iteration (higher gas costs)
- Add complexity without clear benefit
- Not align with Aqua's swap-centric design

For 3+ tokens, compose multiple dual flash loans or use nested callbacks.

## License

See LICENSE file - Aqua Source License 1.1

---

**TL;DR**: DualFlashLoan leverages Aqua's pair-based architecture for gas-optimized two-token flash loans, perfect for arbitrage and complex DeFi strategies.

