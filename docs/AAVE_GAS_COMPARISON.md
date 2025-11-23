# Aave V3 Gas Comparison

This document provides instructions for deploying and testing the Aave V3 flash loan implementation to compare gas costs with Aqua flash loans.

## Overview

We've implemented a minimal Aave V3 flash loan executor to measure and compare gas consumption between:
- **Aqua Flash Loans** - Our custom implementation using Aqua's infrastructure
- **Aave V3 Flash Loans** - Industry standard flash loan protocol

## Architecture

### Aave V3 Flash Loan Executor

The `AaveV3FlashLoanExecutor` contract is a minimal implementation that:
1. Implements `IFlashLoanSimpleReceiver` interface
2. Calls Aave V3 Pool's `flashLoanSimple()` function
3. Receives tokens in `executeOperation()` callback
4. Approves repayment to the Pool
5. Emits events for tracking

### Key Differences from Aqua

| Feature | Aqua | Aave V3 |
|---------|------|---------|
| **Fee Structure** | Configurable (e.g., 9 bps = 0.09%) | Fixed 5 bps (0.05%) |
| **Liquidity Source** | Custom makers via `ship()` | Global liquidity pool |
| **Architecture** | Strategy-based with Aqua router | Pool-based with callbacks |
| **Gas Optimization** | Transient storage, optimized routing | Standard implementation |

## Deployment

### Prerequisites

1. **Sepolia ETH**: Get from [Sepolia Faucet](https://sepoliafaucet.com/)
2. **Environment Setup**: Configure `.env` file with:
   ```bash
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Deploy Aave V3 Flash Loan Executor

```bash
# Deploy only the Aave V3 executor
yarn deploy:aave:sepolia

# Or deploy everything
yarn deploy:sepolia
```

The deployment will:
- Deploy `AaveV3FlashLoanExecutor` with Aave V3 Pool address
- Save deployment artifacts to `deployments/sepolia/`
- Output the deployed contract address

### Aave V3 Sepolia Addresses

```
Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
DAI:  0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
USDT: 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
```

Reference: [Aave V3 Testnet Addresses](https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses)

## Testing

### Step 1: Get Test Tokens

For Aave V3 testing, you need test tokens:
1. Visit [Aave Sepolia Faucet](https://staging.aave.com/faucet/)
2. Get test USDC, DAI, or USDT
3. Send tokens to the deployed `AaveV3FlashLoanExecutor` address

The executor needs enough tokens to repay:
- **Borrow Amount** + **Premium (0.05%)**
- Example: Borrowing 100 USDC requires 100.05 USDC for repayment

### Step 2: Run Aave V3 Test

```bash
yarn test:aave:sepolia
```

This will:
1. Load the deployed `AaveV3FlashLoanExecutor`
2. Execute a flash loan of 100 USDC from Aave V3
3. Measure and display gas consumption
4. Show transaction details and events

### Step 3: Run Aqua Test for Comparison

```bash
yarn test:sepolia
```

This will:
1. Deploy/use test tokens
2. Setup Aqua flash loan strategy
3. Execute a flash loan of 100 TEST tokens
4. Measure and display gas consumption

## Gas Comparison Results

After running both tests, compare the results:

### Expected Metrics

```
┌──────────────────┬──────────────┬──────────────┐
│ Metric           │ Aqua         │ Aave V3      │
├──────────────────┼──────────────┼──────────────┤
│ Total Gas Used   │ ~[TBD]       │ ~[TBD]       │
│ Fee Rate         │ 0.09% (9bps) │ 0.05% (5bps) │
│ Flash Loan Call  │ flashLoan()  │ flashLoanSimple() │
│ Callback         │ executeFlashLoan() │ executeOperation() │
└──────────────────┴──────────────┴──────────────┘
```

### Gas Breakdown

**Aqua Flash Loan Gas Usage:**
1. Entry point: `FlashLoan.flashLoan()`
2. Aqua internal: `AQUA.pull()` - transient storage operations
3. Callback: `IFlashLoanReceiver.executeFlashLoan()`
4. Repayment: ERC20 `transferFrom()`
5. Strategy validation with `nonReentrantStrategy` modifier

**Aave V3 Flash Loan Gas Usage:**
1. Entry point: `Pool.flashLoanSimple()`
2. Pool internal: balance checks, reserve operations
3. Callback: `IFlashLoanSimpleReceiver.executeOperation()`
4. Repayment: ERC20 `transferFrom()` pulled by Pool
5. Pool state updates and interest rate calculations

## Contract Files

### Contracts
- `contracts/AaveV3FlashLoanExecutor.sol` - Minimal Aave V3 executor
- `contracts/IFlashLoanSimpleReceiver.sol` - Aave V3 receiver interface
- `contracts/IAaveV3Pool.sol` - Aave V3 Pool interface

### Scripts
- `scripts/test-aave-v3-sepolia.ts` - Aave V3 gas measurement script
- `deploy/deploy-aave-v3.ts` - Deployment script

## Verification

To verify the deployed contract on Etherscan:

```bash
npx hardhat verify --network sepolia <EXECUTOR_ADDRESS> 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
```

## Analysis

### Key Observations

1. **Gas Efficiency**: [To be measured]
2. **Code Complexity**: Aqua requires strategy setup; Aave V3 uses global pool
3. **Flexibility**: Aqua allows custom fees and makers; Aave V3 has fixed parameters
4. **Liquidity**: Aave V3 has deeper liquidity; Aqua requires makers to provide it

### Use Cases

**Prefer Aqua when:**
- You need custom fee structures
- You want to provide liquidity yourself
- You need maximum gas optimization
- You want strategy-based flash loans

**Prefer Aave V3 when:**
- You need guaranteed deep liquidity
- You want industry-standard implementation
- You need multiple assets simultaneously
- You want proven, audited contracts

## Troubleshooting

### "Insufficient balance for repayment"
- Get test tokens from [Aave Faucet](https://staging.aave.com/faucet/)
- Send tokens to the executor contract address

### "Pool address mismatch"
- Verify Aave V3 Pool address is correct for Sepolia
- Check deployment script configuration

### "Transaction failed"
- Check Sepolia ETH balance
- Verify test token availability
- Check Aave V3 Pool has liquidity for the token

## Resources

- [Aave V3 Documentation](https://docs.aave.com/developers/getting-started/readme)
- [Aave V3 Flash Loans Guide](https://docs.aave.com/developers/guides/flash-loans)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Aave Sepolia Faucet](https://staging.aave.com/faucet/)

## Next Steps

1. **Deploy contracts**: `yarn deploy:aave:sepolia`
2. **Get test tokens**: Visit Aave faucet
3. **Run tests**: Execute both Aqua and Aave V3 tests
4. **Compare results**: Analyze gas consumption
5. **Document findings**: Record your measurements below

---

## Your Results

Record your test results here:

### Test Run: [Date]

**Aqua Flash Loan:**
- Gas Used: 
- Transaction Hash: 
- Fee Paid: 

**Aave V3 Flash Loan:**
- Gas Used: 
- Transaction Hash: 
- Premium Paid: 

**Comparison:**
- Gas Difference: 
- Cost Difference: 
- Notes: 

