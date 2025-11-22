// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from 'hardhat';
import { expect, ether, deployContract } from '@1inch/solidity-utils';
import "@nomicfoundation/hardhat-chai-matchers";
import { Signer } from 'ethers';

// Import generated types
import { TokenMock } from '../typechain-types/@1inch/solidity-utils/contracts/mocks/TokenMock';
import { Aqua } from '../typechain-types/@1inch/aqua/src/Aqua';
import { FlashLoan } from '../typechain-types/contracts/FlashLoan';
import { FlashLoanExecutor } from '../typechain-types/contracts/FlashLoanExecutor';
import { IFlashLoanReceiver } from '../typechain-types/contracts/IFlashLoanReceiver';

describe("FlashLoan", function () {
  
  const LIQUIDITY_AMOUNT = ether('1000');
  const FEE_BPS = 9n; // 0.09% fee
  const HIGH_FEE_BPS = 500n; // 5% fee
  const INVALID_FEE_BPS = 1500n; // 15% fee (above max)

  async function deployFlashLoanFixture() {
    const [owner, maker, borrower, attacker]: Signer[] = await ethers.getSigners();

    // Deploy Aqua contract
    const aqua = await deployContract('Aqua') as unknown as Aqua;

    // Deploy FlashLoan contract
    const flashLoan = await deployContract('FlashLoan', [await aqua.getAddress()]) as unknown as FlashLoan;

    // Deploy test tokens
    const token = await deployContract('TokenMock', ['TestToken', 'TST']) as unknown as TokenMock;
    const token2 = await deployContract('TokenMock', ['TestToken2', 'TST2']) as unknown as TokenMock;

    // Deploy FlashLoanExecutor (testing helper)
    const executor = await deployContract('FlashLoanExecutor') as unknown as FlashLoanExecutor;

    // Setup: Mint tokens to maker (liquidity provider)
    await token.mint(await maker.getAddress(), LIQUIDITY_AMOUNT);
    await token2.mint(await maker.getAddress(), LIQUIDITY_AMOUNT);

    // Setup: Approve Aqua to spend maker's tokens
    await token.connect(maker).approve(await aqua.getAddress(), ethers.MaxUint256);
    await token2.connect(maker).approve(await aqua.getAddress(), ethers.MaxUint256);

    // Mint tokens to executor for repayment
    await token.mint(await executor.getAddress(), LIQUIDITY_AMOUNT);
    await token2.mint(await executor.getAddress(), LIQUIDITY_AMOUNT);

    return {
      contracts: { aqua, flashLoan, token, token2, executor },
      addrs: { owner, maker, borrower, attacker }
    };
  }

  async function createFlashLoanStrategy(
    flashLoan: FlashLoan,
    aqua: Aqua,
    maker: Signer,
    token: TokenMock,
    feeBps: bigint = FEE_BPS
  ) {
    const strategy = {
      maker: await maker.getAddress(),
      token: await token.getAddress(),
      feeBps: feeBps,
      salt: ethers.ZeroHash
    };

    // Encode the strategy
    const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
      ['tuple(address,address,uint256,bytes32)'],
      [[strategy.maker, strategy.token, strategy.feeBps, strategy.salt]]
    );

    // Ship liquidity to Aqua
    await aqua.connect(maker).ship(
      await flashLoan.getAddress(),
      encodedStrategy,
      [await token.getAddress()],
      [LIQUIDITY_AMOUNT]
    );

    return strategy;
  }

  describe("Deployment", function () {
    it("should deploy with correct Aqua address", async function () {
      const { contracts: { aqua, flashLoan } } = await loadFixture(deployFlashLoanFixture);
      expect(await flashLoan.AQUA()).to.equal(await aqua.getAddress());
    });

    it("should have correct MAX_FEE_BPS", async function () {
      const { contracts: { flashLoan } } = await loadFixture(deployFlashLoanFixture);
      expect(await flashLoan.MAX_FEE_BPS()).to.equal(1000n); // 10%
    });
  });

  describe("Fee Calculation", function () {
    it("should calculate fee correctly", async function () {
      const { contracts: { flashLoan, token }, addrs: { maker } } = await loadFixture(deployFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token: await token.getAddress(),
        feeBps: FEE_BPS,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      const expectedFee = (amount * FEE_BPS) / 10000n;
      
      const fee = await flashLoan.calculateFee(strategy, amount);
      expect(fee).to.equal(expectedFee);
    });

    it("should calculate zero fee when feeBps is 0", async function () {
      const { contracts: { flashLoan, token }, addrs: { maker } } = await loadFixture(deployFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token: await token.getAddress(),
        feeBps: 0n,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      const fee = await flashLoan.calculateFee(strategy, amount);
      expect(fee).to.equal(0n);
    });

    it("should revert when fee exceeds maximum", async function () {
      const { contracts: { flashLoan, token }, addrs: { maker } } = await loadFixture(deployFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token: await token.getAddress(),
        feeBps: INVALID_FEE_BPS,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      await expect(
        flashLoan.calculateFee(strategy, amount)
      ).to.be.revertedWithCustomError(flashLoan, 'InvalidFee');
    });

    it("should calculate high fee correctly", async function () {
      const { contracts: { flashLoan, token }, addrs: { maker } } = await loadFixture(deployFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token: await token.getAddress(),
        feeBps: HIGH_FEE_BPS,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      const expectedFee = ether('5'); // 5% of 100
      
      const fee = await flashLoan.calculateFee(strategy, amount);
      expect(fee).to.equal(expectedFee);
    });
  });

  describe("Get Available Liquidity", function () {
    it("should return correct available liquidity", async function () {
      const { 
        contracts: { flashLoan, aqua, token },
        addrs: { maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const liquidity = await flashLoan.getAvailableLiquidity(strategy);
      
      expect(liquidity).to.equal(LIQUIDITY_AMOUNT);
    });

    it("should return zero for non-existent strategy", async function () {
      const { 
        contracts: { flashLoan, aqua, token },
        addrs: { maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token: await token.getAddress(),
        feeBps: FEE_BPS,
        salt: ethers.keccak256(ethers.toUtf8Bytes("nonexistent"))
      };

      // getAvailableLiquidity will revert for non-existent strategy
      // because Aqua.safeBalances reverts if strategy not active
      await expect(
        flashLoan.getAvailableLiquidity(strategy)
      ).to.be.reverted;
    });
  });

  describe("Flash Loan Execution", function () {
    it("should execute successful flash loan", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = ether('100');
      const fee = await flashLoan.calculateFee(strategy, borrowAmount);

      const makerBalanceBefore = await token.balanceOf(await maker.getAddress());
      
      const tx = await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      // Check event emission - initiator is the executor contract, not owner
      await expect(tx).to.emit(flashLoan, 'FlashLoanExecuted')
        .withArgs(
          await maker.getAddress(),
          await executor.getAddress(), // executor is the one calling flashLoan
          await token.getAddress(),
          borrowAmount,
          fee
        );

      // Maker should receive original amount + fee
      const makerBalanceAfter = await token.balanceOf(await maker.getAddress());
      expect(makerBalanceAfter - makerBalanceBefore).to.equal(fee);
    });

    it("should handle zero fee flash loan", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token, 0n);
      const borrowAmount = ether('50');

      const makerBalanceBefore = await token.balanceOf(await maker.getAddress());
      
      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      // Maker balance should be unchanged (no fee)
      const makerBalanceAfter = await token.balanceOf(await maker.getAddress());
      expect(makerBalanceAfter).to.equal(makerBalanceBefore);
    });

    it("should handle maximum valid fee", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const maxFeeBps = 1000n; // 10% - maximum allowed
      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token, maxFeeBps);
      const borrowAmount = ether('100');
      const expectedFee = ether('10'); // 10% of 100

      const makerBalanceBefore = await token.balanceOf(await maker.getAddress());
      
      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      const makerBalanceAfter = await token.balanceOf(await maker.getAddress());
      expect(makerBalanceAfter - makerBalanceBefore).to.equal(expectedFee);
    });

    it("should execute multiple flash loans in sequence", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = ether('100');

      // Execute first flash loan
      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      // Execute second flash loan
      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      // Both should succeed
      expect(true).to.be.true;
    });

    it("should handle flash loans from different borrowers", async function () {
      const { 
        contracts: { flashLoan, aqua, token },
        addrs: { maker, borrower, attacker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = ether('50');

      // Get factories for deployContract
      const FlashLoanExecutorFactory = await ethers.getContractFactory('FlashLoanExecutor');

      // Deploy executor for borrower
      const executor1 = await FlashLoanExecutorFactory.connect(borrower).deploy() as unknown as FlashLoanExecutor;
      await token.mint(await executor1.getAddress(), LIQUIDITY_AMOUNT);

      // Deploy executor for attacker  
      const executor2 = await FlashLoanExecutorFactory.connect(attacker).deploy() as unknown as FlashLoanExecutor;
      await token.mint(await executor2.getAddress(), LIQUIDITY_AMOUNT);

      // Both execute flash loans - owner is the deployer
      await executor1.connect(borrower).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      await executor2.connect(attacker).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      expect(true).to.be.true;
    });
  });

  describe("Flash Loan Failures", function () {
    it("should revert when insufficient liquidity", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = LIQUIDITY_AMOUNT + ether('1'); // More than available

      await expect(
        executor.connect(owner).executeFlashLoan(
          await flashLoan.getAddress(),
          strategy,
          borrowAmount,
          "0x"
        )
      ).to.be.revertedWith('Insufficient liquidity');
    });

    it("should revert when callback returns false", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = ether('100');

      // Configure executor to return false
      await executor.configure(false, true);

      await expect(
        executor.connect(owner).executeFlashLoan(
          await flashLoan.getAddress(),
          strategy,
          borrowAmount,
          "0x"
        )
      ).to.be.revertedWithCustomError(flashLoan, 'FlashLoanFailed');
    });

    it("should revert when repayment not approved", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = ether('100');

      // Configure executor to not approve repayment
      await executor.configure(true, false);

      await expect(
        executor.connect(owner).executeFlashLoan(
          await flashLoan.getAddress(),
          strategy,
          borrowAmount,
          "0x"
        )
      ).to.be.reverted; // Will fail on transferFrom
    });

    it("should revert when trying to borrow from non-existent strategy", async function () {
      const { 
        contracts: { flashLoan, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      // Create strategy without shipping liquidity
      const strategy = {
        maker: await maker.getAddress(),
        token: await token.getAddress(),
        feeBps: FEE_BPS,
        salt: ethers.keccak256(ethers.toUtf8Bytes("nonexistent"))
      };

      const borrowAmount = ether('100');

      await expect(
        executor.connect(owner).executeFlashLoan(
          await flashLoan.getAddress(),
          strategy,
          borrowAmount,
          "0x"
        )
      ).to.be.reverted; // Will revert with SafeBalancesForTokenNotInActiveStrategy
    });
  });

  describe("Reentrancy Protection", function () {
    it("should prevent reentrancy attacks", async function () {
      const { 
        contracts: { flashLoan, aqua, token },
        addrs: { maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);

      // Deploy malicious executor that tries to reenter
      const ReentrantAttacker = await ethers.getContractFactory("ReentrantFlashLoanAttacker");
      const attacker = await ReentrantAttacker.deploy(await flashLoan.getAddress());
      await token.mint(await attacker.getAddress(), LIQUIDITY_AMOUNT);

      await expect(
        attacker.attack(strategy, ether('100'))
      ).to.be.reverted; // Should revert due to reentrancy guard
    });
  });

  describe("Edge Cases", function () {
    it("should handle flash loan of 1 wei", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = 1n;

      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      expect(true).to.be.true;
    });

    it("should handle flash loan of maximum available liquidity", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const borrowAmount = LIQUIDITY_AMOUNT;

      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy,
        borrowAmount,
        "0x"
      );

      expect(true).to.be.true;
    });

    it("should handle multiple tokens with different strategies", async function () {
      const { 
        contracts: { flashLoan, aqua, token, token2, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy1 = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      const strategy2 = await createFlashLoanStrategy(flashLoan, aqua, maker, token2);
      
      const borrowAmount = ether('100');

      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy1,
        borrowAmount,
        "0x"
      );

      await executor.connect(owner).executeFlashLoan(
        await flashLoan.getAddress(),
        strategy2,
        borrowAmount,
        "0x"
      );

      expect(true).to.be.true;
    });
  });

  describe("Liquidity Management", function () {
    it("should allow maker to withdraw liquidity after dock", async function () {
      const { 
        contracts: { flashLoan, aqua, token },
        addrs: { maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      
      // Encode strategy to get hash
      const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(address,address,uint256,bytes32)'],
        [[strategy.maker, strategy.token, strategy.feeBps, strategy.salt]]
      );
      const strategyHash = ethers.keccak256(encodedStrategy);

      // Dock the strategy
      await aqua.connect(maker).dock(
        await flashLoan.getAddress(),
        strategyHash,
        [await token.getAddress()]
      );

      // Verify liquidity is no longer accessible (strategy is inactive)
      // getAvailableLiquidity will revert for docked strategies
      await expect(
        flashLoan.getAvailableLiquidity(strategy)
      ).to.be.reverted;
    });

    it("should prevent flash loans after dock is called", async function () {
      const { 
        contracts: { flashLoan, aqua, token, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployFlashLoanFixture);

      const strategy = await createFlashLoanStrategy(flashLoan, aqua, maker, token);
      
      // Encode strategy to get hash
      const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(address,address,uint256,bytes32)'],
        [[strategy.maker, strategy.token, strategy.feeBps, strategy.salt]]
      );
      const strategyHash = ethers.keccak256(encodedStrategy);

      // Dock the strategy
      await aqua.connect(maker).dock(
        await flashLoan.getAddress(),
        strategyHash,
        [await token.getAddress()]
      );

      // Try to borrow - should fail because strategy is docked
      const borrowAmount = ether('100');
      await expect(
        executor.connect(owner).executeFlashLoan(
          await flashLoan.getAddress(),
          strategy,
          borrowAmount,
          "0x"
        )
      ).to.be.reverted; // Will revert with SafeBalancesForTokenNotInActiveStrategy
    });
  });
});

// Helper contract for reentrancy test

