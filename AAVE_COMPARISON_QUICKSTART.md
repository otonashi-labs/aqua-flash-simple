# Aave V3 vs Aqua Gas Comparison - Quick Start

## Quick Commands

### 1. Deploy Aave V3 Executor to Sepolia
```bash
yarn deploy:aave:sepolia
```

### 2. Get Test Tokens
- Visit: https://staging.aave.com/faucet/
- Get test USDC
- Send to deployed executor address (shown after deployment)

### 3. Test Aave V3 Flash Loan (Measure Gas)
```bash
yarn test:aave:sepolia
```

### 4. Test Aqua Flash Loan for Comparison
```bash
yarn test:sepolia
```

## What to Compare

After running both tests, compare:

| Metric | Where to Find |
|--------|---------------|
| **Total Gas Used** | Console output: "Gas Used: XXX" |
| **Gas Cost in ETH** | Console output: "Total Cost: X.XXX ETH" |
| **Transaction Hash** | Console output or terminal |
| **Fee Paid** | Aqua: 0.09% / Aave V3: 0.05% |

## Expected Output

### Aave V3 Test Output
```
⛽ Gas Metrics:
==================================================
Gas Used: XXXXX
Gas Price: X.XX gwei
Total Cost: 0.00XXX ETH
==================================================
```

### Aqua Test Output
```
Gas used: XXXXX
Fee earned by maker: 0.09 TEST
```

## Aave V3 Sepolia Addresses

```
Pool:    0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
USDC:    0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
DAI:     0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
USDT:    0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
```

## Prerequisites

1. **Sepolia ETH**: https://sepoliafaucet.com/
2. **Environment Variables**: Create `.env` file:
   ```env
   SEPOLIA_RPC_URL=your_rpc_url
   PRIVATE_KEY=your_private_key_without_0x
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

## Troubleshooting

**"Insufficient balance for repayment"**
- Get USDC from Aave faucet
- Send to executor address shown in deployment

**"Could not load deployment"**
- Run deployment first: `yarn deploy:aave:sepolia`

**"Low balance warning"**
- Get Sepolia ETH from faucet

## Verification

Verify deployed contract on Etherscan:
```bash
npx hardhat verify --network sepolia <EXECUTOR_ADDRESS> 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
```

## Full Documentation

See `docs/AAVE_GAS_COMPARISON.md` for detailed information.

