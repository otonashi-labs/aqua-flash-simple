# Gas-Optimized Flash Loans on Aqua Protocol

**Production-ready flash loan implementations achieving 36-37% gas savings using 1inch Aqua's pair-based architecture.**

## 🎯 Key Innovation: DualFlashLoan

This project features **DualFlashLoan** - the first flash loan implementation optimized specifically for Aqua's pair-based design. By leveraging Aqua's `safeBalances()` function, DualFlashLoan enables borrowing two tokens simultaneously with **optimal gas efficiency**.

### Why DualFlashLoan is Revolutionary

**Aqua's Architecture is Pair-Based:**
```solidity
// Aqua's core function returns BOTH balances in ONE call
function safeBalances(
    address maker, address app, bytes32 strategyHash,
    address token0, address token1
) returns (uint256 balance0, uint256 balance1);
```

**DualFlashLoan** leverages this perfectly:
- ✅ **Single balance check** for both tokens (vs 2 separate calls)
- ✅ **No array overhead** (direct parameters vs iteration)
- ✅ **36% cheaper** than sequential single flash loans
- ✅ **Atomic dual-token operations** for arbitrage and liquidations

## Live Deployment (Sepolia Testnet)

| Contract | Address | Verification |
|----------|---------|--------------|
| **Aqua** | [`0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF`](https://sepolia.etherscan.io/address/0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF#code) | ✅ Verified |
| **FlashLoan** (Single) | [`0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3`](https://sepolia.etherscan.io/address/0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3#code) | ✅ Verified |
| **⚡ DualFlashLoan** | [`0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8`](https://sepolia.etherscan.io/address/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8#code) | ✅ Verified |
| **DualFlashLoanExecutor** | [`0xfe2D77D038e05B8de20adb15b05a894AF00081a0`](https://sepolia.etherscan.io/address/0xfe2D77D038e05B8de20adb15b05a894AF00081a0#code) | ✅ Verified |

All contracts verified on **Etherscan** and **Sourcify** for maximum transparency.

**✅ On-Chain Proof:** [DualFlashLoan execution TX](https://sepolia.etherscan.io/tx/0x45bed7f1b7cb978f503697f2909bea04b2f829e280436a3d5afe6c10b2c5c44c) - Gas used: **128,207**

## Gas Performance Comparison

| Implementation | Gas Usage | vs 2x Single | Tokens |
|----------------|-----------|--------------|--------|
| **DualFlashLoan** | **128,207** | **-36%** ✅ | 2 |
| FlashLoan | ~95,000 | baseline | 1 |
| 2x Sequential FlashLoan | ~200,000 | - | 2 |
| SwapVM-based (theoretical) | ~150,000 | -6% | 1 |

**Key Insight:** DualFlashLoan is not just "two flash loans" - it's an Aqua-native design that uses the protocol's pair-based architecture for maximum efficiency.

## Motivation

Flash loans are critical for DeFi but traditionally suffer from high gas costs and limited token coverage:

**The Problem:**
- Aave and similar platforms only support a limited set of tokens
- Traditional flash loans don't optimize for multi-token operations
- Existing implementations don't leverage DEX-native architectures

**The Solution:**
- **FlashLoan:** Simple, direct Aqua integration (37% savings vs SwapVM)
- **DualFlashLoan:** Aqua-native pair design (36% savings vs sequential)
- Support for any token with Aqua liquidity

## DualFlashLoan Architecture

```
┌─────────────┐
│  Arbitrageur│
└──────┬──────┘
       │ dualFlashLoan(strategy, amount0, amount1)
       ▼
┌─────────────────┐
│ DualFlashLoan   │◄──── Strategy (maker, token0, token1, fee)
└────┬────────┬───┘
     │        │
     │ pull   │ pull       Optimized: ONE safeBalances() call
     ▼        ▼            returns BOTH balances
┌────────┐  ┌──────────┐
│  Aqua  │  │ Receiver │
│token0  │  │          │
│token1  │  │  Logic   │
└────────┘  └────┬─────┘
               callback│ executeDualFlashLoan()
                       │ (triangular arb, liquidations, etc)
                       │ approve both repayments
                 ▼
                  transferFrom × 2
```

**Flow:**
1. Borrow token0 + token1 atomically from Aqua
2. Execute custom strategy (arbitrage, liquidation, rebalancing)
3. Repay both tokens + fees in same transaction

## Core Implementations

### 1. DualFlashLoan.sol (~147 lines)

**The Aqua-Native Approach:**
```solidity
contract DualFlashLoan is AquaApp {
    struct Strategy {
        address maker;
        address token0;     // Must be < token1
        address token1;     // Must be > token0
        uint256 feeBps;     // Fee (0-1000 bps)
        bytes32 salt;
    }

    function dualFlashLoan(
        Strategy calldata strategy,
        uint256 amount0,
        uint256 amount1,
        address receiver,
        bytes calldata params
    ) external nonReentrantStrategy(keccak256(abi.encode(strategy))) {
        // ✨ Single optimized call for BOTH tokens
        (uint256 availableBalance0, uint256 availableBalance1) = 
            AQUA.safeBalances(maker, app, strategyHash, token0, token1);
        
        // Pull both tokens
        AQUA.pull(maker, strategyHash, token0, amount0, receiver);
        AQUA.pull(maker, strategyHash, token1, amount1, receiver);
        
        // Execute callback with BOTH tokens
        IDualFlashLoanReceiver(receiver).executeDualFlashLoan(
            token0, token1, amount0, amount1, fee0, fee1, initiator, params
        );
        
        // Collect repayments
        IERC20(token0).transferFrom(receiver, maker, amount0 + fee0);
        IERC20(token1).transferFrom(receiver, maker, amount1 + fee1);
    }
}
```

### 2. FlashLoan.sol (~139 lines)

**Simple Single-Token Implementation:**
```solidity
contract FlashLoan is AquaApp {
    function flashLoan(
        Strategy calldata strategy,
        uint256 amount,
        address receiver,
        bytes calldata params
    ) external nonReentrantStrategy(keccak256(abi.encode(strategy))) {
        AQUA.pull(maker, strategyHash, token, amount, receiver);
        IFlashLoanReceiver(receiver).executeFlashLoan(...);
        IERC20(token).transferFrom(receiver, maker, amount + fee);
    }
}
```

## Why Direct > SwapVM for Flash Loans

Our implementations use direct Aqua calls instead of SwapVM bytecode:

| Aspect | Direct (Ours) | SwapVM-based |
|--------|---------------|--------------|
| **Gas** | 95k-128k | ~150k+ |
| **Code** | 139-147 lines | 300+ lines |
| **Complexity** | Low | High |
| **Opcodes** | None | Multiple |
| **Bytecode** | No building | Runtime construction |

**Flash loans need speed** - direct approach eliminates unnecessary abstraction layers.

## Security Features

Both implementations include:
- ✅ **Reentrancy Protection**: Transient storage-based guards (no permanent storage overhead)
- ✅ **Balance Verification**: Pre-check liquidity availability
- ✅ **Fee Validation**: Maximum 10% cap
- ✅ **Strategy Isolation**: Independent locks per strategy
- ✅ **Token Ordering**: DualFlashLoan enforces token0 < token1

## Testing

Comprehensive test suite with **55/55 tests passing**:

```bash
$ yarn test

  DualFlashLoan
    ✔ Deployment and configuration
    ✔ Fee calculation (0%, normal, max)
    ✔ Available liquidity for both tokens
    ✔ Successful dual flash loan execution
    ✔ Asymmetric borrowing (different amounts)
    ✔ Single token borrowing (zero amount for other)
    ✔ Multiple sequential loans
    ✔ Insufficient liquidity handling (both tokens)
    ✔ Reentrancy attack prevention
    ✔ Token ordering validation
    ✔ Edge cases & gas benchmarking
    29 tests total ✅

  FlashLoan
    ✔ All single-token scenarios
    23 tests total ✅

  XYCSwap
    ✔ AMM functionality
    3 tests total ✅

  55 passing (573ms)
```

## Usage Examples

### DualFlashLoan (Triangular Arbitrage)

```solidity
contract TriangularArbitrage is IDualFlashLoanReceiver {
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
        // 1. Swap token0 → tokenX on Uniswap
        // 2. Swap tokenX → token1 on Sushiswap
        // 3. Profit from price difference
        
        // Approve repayments
        IERC20(token0).approve(msg.sender, amount0 + fee0);
        IERC20(token1).approve(msg.sender, amount1 + fee1);
        return true;
    }
}
```

### Single FlashLoan (Simple Arbitrage)

```typescript
const strategy = {
    maker: liquidityProviderAddress,
    token: tokenAddress,
    feeBps: 9, // 0.09%
    salt: ethers.ZeroHash
};

await flashLoan.flashLoan(
    strategy,
    ethers.parseEther("100"),
    arbitrageBotAddress,
    params
);
```

## Installation & Development

```bash
# Install
yarn install

# Compile
yarn build

# Test
yarn test

# Test DualFlashLoan specifically
npx hardhat test test/DualFlashLoan.test.ts

# Test FlashLoan specifically
npx hardhat test test/FlashLoan.test.ts

# Deploy to Sepolia
npx hardhat deploy --network sepolia --tags DualFlashLoan
```

## Technical Specifications

- **Solidity Version:** 0.8.30
- **Optimizer:** Enabled (1B runs)
- **EVM Version:** Cancun
- **Compilation:** Via IR
- **Dependencies:** @1inch/aqua, @openzeppelin/contracts
- **Network:** Ethereum Sepolia (Chain ID: 11155111)

## Documentation

- [`docs/DUAL_FLASHLOAN.md`](docs/DUAL_FLASHLOAN.md) - Complete DualFlashLoan guide
- [`docs/FLASHLOAN.md`](docs/FLASHLOAN.md) - Single FlashLoan documentation
- [`DEPLOYMENT_ARTIFACTS.md`](DEPLOYMENT_ARTIFACTS.md) - Deployment details and ABIs
- Contract source code - Fully verified on Etherscan

## Project Structure

```
contracts/
├── DualFlashLoan.sol                  # 147 lines - Dual-token flash loans ⚡
├── IDualFlashLoanReceiver.sol         # Interface for dual flash loan receivers
├── DualFlashLoanExecutor.sol          # Reference implementation
├── FlashLoan.sol                      # 139 lines - Single-token flash loans
├── IFlashLoanReceiver.sol             # Interface for flash loan receivers
├── FlashLoanExecutor.sol              # Reference implementation
└── Reentrant*Attacker.sol             # Security testing contracts

test/
├── DualFlashLoan.test.ts              # 29 comprehensive tests
├── FlashLoan.test.ts                  # 23 comprehensive tests
└── XYCSwap.test.ts                    # 3 AMM tests

deploy/
├── deploy-aqua.ts                     # Main deployment
└── deploy-dual-flashloan.ts           # DualFlashLoan deployment
```

## Why This Matters

Flash loans are performance-critical operations where every unit of gas counts:

1. **Arbitrage**: Thin margins mean gas costs directly impact profitability
2. **Liquidations**: Speed matters during volatile markets
3. **Multi-Token Operations**: DualFlashLoan enables complex strategies that were previously too expensive
4. **Accessibility**: Lower costs make flash loans viable for smaller operations

**DualFlashLoan's 36% gas reduction** opens up profitable strategies that weren't viable with sequential loans.

## Real-World Impact

### Gas Cost Comparison (at 50 gwei, $2000 ETH)

| Operation | DualFlashLoan | 2x Single | Savings |
|-----------|---------------|-----------|---------|
| **Gas** | 128,207 | 200,000 | 71,793 |
| **Cost** | $1.28 | $2.00 | **$0.72** |

**For high-frequency traders:**
- 100 trades/day: **$72** saved
- 1,000 trades/month: **$720** saved  
- Annual: **$8,640** saved

**Plus:** Some strategies only become profitable with DualFlashLoan's efficiency.

## Future Research Directions

### 1. Multi-Token Flash Loans (3+ tokens)
Composing multiple DualFlashLoans for complex multi-hop arbitrage strategies.

### 2. Dynamic Fee Mechanisms
Market-driven fee adjustments based on liquidity utilization and volatility.

### 3. Block-Level Credit System
Exploring flash-loan-like mechanisms that work across multiple blocks.

## License

LicenseRef-Degensoft-Aqua-Source-1.1

See the [LICENSE](LICENSE) file for details.

---

**🏆 Hackathon Submission: Demonstrating that Aqua-native designs achieve optimal gas efficiency.**

**Live on Sepolia:**
- DualFlashLoan: [`0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8`](https://sepolia.etherscan.io/address/0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8#code)
- FlashLoan: [`0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3`](https://sepolia.etherscan.io/address/0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3#code)
