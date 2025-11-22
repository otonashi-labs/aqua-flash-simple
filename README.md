# Aqua App Template - Simple Flash Loans

## Description

This is a project template for developing applications based on the 1inch Aqua protocol. The project includes:

1. **XYCSwap** - An implementation of XYC (X*Y=C) constant product AMM using the Aqua protocol for efficient token exchanges
2. **FlashLoan** - A simple, gas-optimized flash loan implementation using Aqua's native pull/push mechanism

The template provides a ready-to-use infrastructure for creating decentralized trading applications with support for various exchange strategies and integration with the Aqua protocol for gas cost optimization.

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- Git

### Clone the Repository

```bash
git clone https://github.com/1inch/aqua-app-template.git
cd aqua-app-template
```

### Install Dependencies

Using Yarn:
```bash
yarn install
```

### Compile Contracts

```bash
yarn build
```

### Run Tests

```bash
yarn test
```

### Local Development

#### Start Local Hardhat Node

In a separate terminal, start the local blockchain node:

```bash
yarn node
```

#### Deploy Contracts to Localhost

After starting the local node, in a new terminal run the deployment:

```bash
yarn deploy:localhost
```

## Project Structure

```
aqua-flash-simple/
├── contracts/                      # Solidity contracts
│   ├── FlashLoan.sol              # Flash loan implementation
│   ├── FlashLoanExecutor.sol      # Flash loan helper/testing contract
│   ├── IFlashLoanReceiver.sol     # Flash loan receiver interface
│   ├── ReentrantFlashLoanAttacker.sol # Reentrancy test contract
│   ├── SwapExecutor.sol           # Swap executor for XYC
│   └── XYCSwap.sol                # XYC swap implementation
├── deploy/                         # Deployment scripts
│   └── deploy-aqua.ts             # Contract deployment script
├── docs/                           # Documentation
│   ├── FLASHLOAN.md               # Flash loan documentation
│   └── ...                         # Other docs
├── test/                           # Tests
│   ├── FlashLoan.test.ts          # Flash loan tests (23 tests)
│   ├── XYCSwap.test.ts            # XYC swap tests
│   └── utils.ts                   # Test utility functions
└── hardhat.config.ts              # Hardhat configuration
```

## Features

### Flash Loans ⚡
- **Simple & Gas Optimized**: ~80-100k gas vs 150-200k in complex implementations
- **Reentrancy Protected**: Uses transient storage for protection
- **Flexible Fees**: Configurable up to 10% maximum
- **Well Tested**: 23 comprehensive tests covering all scenarios

See [docs/FLASHLOAN.md](docs/FLASHLOAN.md) for detailed documentation.

### XYCSwap (Constant Product AMM)
- Constant product formula (x*y=const)
- Configurable swap fees
- Direct and callback-based swaps
- Integration with Aqua protocol

## Available Commands

- `yarn build` - Compile contracts
- `yarn test` - Run all tests (26 tests total)
- `npx hardhat test test/FlashLoan.test.ts` - Run flash loan tests only
- `npx hardhat test test/XYCSwap.test.ts` - Run XYC swap tests only
- `npx hardhat node` - Start local Hardhat node
- `yarn deploy:localhost` - Deploy to local network
- `yarn deploy` - Deploy to selected network
- `yarn clean` - Clean compilation artifacts

## Quick Start - Flash Loans

```typescript
// 1. Create a strategy
const strategy = {
  maker: makerAddress,
  token: tokenAddress,
  feeBps: 9, // 0.09% fee
  salt: ethers.ZeroHash
};

// 2. Ship liquidity to Aqua
await aqua.connect(maker).ship(
  flashLoanAddress,
  encodedStrategy,
  [tokenAddress],
  [liquidityAmount]
);

// 3. Execute flash loan
await flashLoan.flashLoan(
  strategy,
  borrowAmount,
  receiverAddress,
  params
);
```

See [docs/FLASHLOAN.md](docs/FLASHLOAN.md) for complete usage examples.

## 📄 License

This project is licensed under the **LicenseRef-Degensoft-Aqua-Source-1.1**

See the [LICENSE](LICENSE) file for details.
See the [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES) file for information about third-party software, libraries, and dependencies used in this project.

**Contact for licensing inquiries:**
- 📧 license@degensoft.com 
- 📧 legal@degensoft.com
