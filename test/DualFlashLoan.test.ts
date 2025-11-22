// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from 'hardhat';
import { expect, ether, deployContract } from '@1inch/solidity-utils';
import "@nomicfoundation/hardhat-chai-matchers";
import { Signer } from 'ethers';

// Import generated types
import { TokenMock } from '../typechain-types/@1inch/solidity-utils/contracts/mocks/TokenMock';
import { Aqua } from '../typechain-types/@1inch/aqua/src/Aqua';
import { DualFlashLoan } from '../typechain-types/contracts/DualFlashLoan';
import { DualFlashLoanExecutor } from '../typechain-types/contracts/DualFlashLoanExecutor';
import { IDualFlashLoanReceiver } from '../typechain-types/contracts/IDualFlashLoanReceiver';

describe("DualFlashLoan", function () {
  
  const LIQUIDITY_AMOUNT = ether('1000');
  const FEE_BPS = 9n; // 0.09% fee
  const HIGH_FEE_BPS = 500n; // 5% fee
  const INVALID_FEE_BPS = 1500n; // 15% fee (above max)

  async function deployDualFlashLoanFixture() {
    const [owner, maker, borrower, attacker]: Signer[] = await ethers.getSigners();

    // Deploy Aqua contract
    const aqua = await deployContract('Aqua') as unknown as Aqua;

    // Deploy DualFlashLoan contract
    const dualFlashLoan = await deployContract('DualFlashLoan', [await aqua.getAddress()]) as unknown as DualFlashLoan;

    // Deploy test tokens (ensure token0 < token1 addresses)
    const tokenA = await deployContract('TokenMock', ['TestToken1', 'TST1']) as unknown as TokenMock;
    const tokenB = await deployContract('TokenMock', ['TestToken2', 'TST2']) as unknown as TokenMock;
    
    // Sort tokens by address
    const tokenAAddress = await tokenA.getAddress();
    const tokenBAddress = await tokenB.getAddress();
    const [token0, token0Address, token1, token1Address] = 
      tokenAAddress < tokenBAddress 
        ? [tokenA, tokenAAddress, tokenB, tokenBAddress]
        : [tokenB, tokenBAddress, tokenA, tokenAAddress];

    // Deploy DualFlashLoanExecutor (testing helper)
    const executor = await deployContract('DualFlashLoanExecutor') as unknown as DualFlashLoanExecutor;

    // Setup: Mint tokens to maker (liquidity provider)
    await token0.mint(await maker.getAddress(), LIQUIDITY_AMOUNT);
    await token1.mint(await maker.getAddress(), LIQUIDITY_AMOUNT);

    // Setup: Approve Aqua to spend maker's tokens
    await token0.connect(maker).approve(await aqua.getAddress(), ethers.MaxUint256);
    await token1.connect(maker).approve(await aqua.getAddress(), ethers.MaxUint256);

    // Mint tokens to executor for repayment
    await token0.mint(await executor.getAddress(), LIQUIDITY_AMOUNT);
    await token1.mint(await executor.getAddress(), LIQUIDITY_AMOUNT);

    return {
      contracts: { aqua, dualFlashLoan, token0, token1, executor },
      addrs: { owner, maker, borrower, attacker },
      addresses: { token0: token0Address, token1: token1Address }
    };
  }

  async function createDualFlashLoanStrategy(
    dualFlashLoan: DualFlashLoan,
    aqua: Aqua,
    maker: Signer,
    token0: TokenMock,
    token1: TokenMock,
    feeBps: bigint = FEE_BPS
  ) {
    const token0Address = await token0.getAddress();
    const token1Address = await token1.getAddress();
    
    // Ensure token0 < token1
    if (token0Address >= token1Address) {
      throw new Error("Token addresses must be ordered: token0 < token1");
    }

    const strategy = {
      maker: await maker.getAddress(),
      token0: token0Address,
      token1: token1Address,
      feeBps: feeBps,
      salt: ethers.ZeroHash
    };

    // Encode the strategy
    const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
      ['tuple(address,address,address,uint256,bytes32)'],
      [[strategy.maker, strategy.token0, strategy.token1, strategy.feeBps, strategy.salt]]
    );

    // Ship liquidity to Aqua for both tokens
    await aqua.connect(maker).ship(
      await dualFlashLoan.getAddress(),
      encodedStrategy,
      [token0Address, token1Address],
      [LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT]
    );

    return strategy;
  }

  describe("Deployment", function () {
    it("should deploy with correct Aqua address", async function () {
      const { contracts: { aqua, dualFlashLoan } } = await loadFixture(deployDualFlashLoanFixture);
      expect(await dualFlashLoan.AQUA()).to.equal(await aqua.getAddress());
    });

    it("should have correct MAX_FEE_BPS", async function () {
      const { contracts: { dualFlashLoan } } = await loadFixture(deployDualFlashLoanFixture);
      expect(await dualFlashLoan.MAX_FEE_BPS()).to.equal(1000n); // 10%
    });
  });

  describe("Fee Calculation", function () {
    it("should calculate fee correctly", async function () {
      const { 
        contracts: { dualFlashLoan, token0, token1 }, 
        addrs: { maker } 
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token0: await token0.getAddress(),
        token1: await token1.getAddress(),
        feeBps: FEE_BPS,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      const expectedFee = (amount * FEE_BPS) / 10000n;
      
      const fee = await dualFlashLoan.calculateFee(strategy, amount);
      expect(fee).to.equal(expectedFee);
    });

    it("should calculate zero fee when feeBps is 0", async function () {
      const { 
        contracts: { dualFlashLoan, token0, token1 }, 
        addrs: { maker } 
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token0: await token0.getAddress(),
        token1: await token1.getAddress(),
        feeBps: 0n,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      const fee = await dualFlashLoan.calculateFee(strategy, amount);
      expect(fee).to.equal(0n);
    });

    it("should revert when fee exceeds maximum", async function () {
      const { 
        contracts: { dualFlashLoan, token0, token1 }, 
        addrs: { maker } 
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token0: await token0.getAddress(),
        token1: await token1.getAddress(),
        feeBps: INVALID_FEE_BPS,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      await expect(
        dualFlashLoan.calculateFee(strategy, amount)
      ).to.be.revertedWithCustomError(dualFlashLoan, 'InvalidFee');
    });

    it("should calculate high fee correctly", async function () {
      const { 
        contracts: { dualFlashLoan, token0, token1 }, 
        addrs: { maker } 
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token0: await token0.getAddress(),
        token1: await token1.getAddress(),
        feeBps: HIGH_FEE_BPS,
        salt: ethers.ZeroHash
      };

      const amount = ether('100');
      const expectedFee = ether('5'); // 5% of 100
      
      const fee = await dualFlashLoan.calculateFee(strategy, amount);
      expect(fee).to.equal(expectedFee);
    });
  });

  describe("Get Available Liquidity", function () {
    it("should return correct available liquidity for both tokens", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1 },
        addrs: { maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const [liquidity0, liquidity1] = await dualFlashLoan.getAvailableLiquidity(strategy);
      
      expect(liquidity0).to.equal(LIQUIDITY_AMOUNT);
      expect(liquidity1).to.equal(LIQUIDITY_AMOUNT);
    });

    it("should revert for non-existent strategy", async function () {
      const { 
        contracts: { dualFlashLoan, token0, token1 },
        addrs: { maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = {
        maker: await maker.getAddress(),
        token0: await token0.getAddress(),
        token1: await token1.getAddress(),
        feeBps: FEE_BPS,
        salt: ethers.keccak256(ethers.toUtf8Bytes("nonexistent"))
      };

      await expect(
        dualFlashLoan.getAvailableLiquidity(strategy)
      ).to.be.reverted;
    });

    it("should revert if tokens are not properly ordered", async function () {
      const { 
        contracts: { dualFlashLoan, token0, token1 },
        addrs: { maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      // Create strategy with reversed token order
      const strategy = {
        maker: await maker.getAddress(),
        token0: await token1.getAddress(), // Wrong order
        token1: await token0.getAddress(), // Wrong order
        feeBps: FEE_BPS,
        salt: ethers.ZeroHash
      };

      await expect(
        dualFlashLoan.getAvailableLiquidity(strategy)
      ).to.be.revertedWithCustomError(dualFlashLoan, 'InvalidTokenOrder');
    });
  });

  describe("Dual Flash Loan Execution", function () {
    it("should execute successful dual flash loan", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('200');
      const fee0 = await dualFlashLoan.calculateFee(strategy, borrowAmount0);
      const fee1 = await dualFlashLoan.calculateFee(strategy, borrowAmount1);

      const makerBalance0Before = await token0.balanceOf(await maker.getAddress());
      const makerBalance1Before = await token1.balanceOf(await maker.getAddress());
      
      const tx = await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      // Check event emission
      await expect(tx).to.emit(dualFlashLoan, 'DualFlashLoanExecuted')
        .withArgs(
          await maker.getAddress(),
          await executor.getAddress(),
          await token0.getAddress(),
          await token1.getAddress(),
          borrowAmount0,
          borrowAmount1,
          fee0,
          fee1
        );

      // Maker should receive fees for both tokens
      const makerBalance0After = await token0.balanceOf(await maker.getAddress());
      const makerBalance1After = await token1.balanceOf(await maker.getAddress());
      expect(makerBalance0After - makerBalance0Before).to.equal(fee0);
      expect(makerBalance1After - makerBalance1Before).to.equal(fee1);
    });

    it("should handle zero fee dual flash loan", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1, 0n);
      const borrowAmount0 = ether('50');
      const borrowAmount1 = ether('75');

      const makerBalance0Before = await token0.balanceOf(await maker.getAddress());
      const makerBalance1Before = await token1.balanceOf(await maker.getAddress());
      
      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      // Maker balances should be unchanged (no fee)
      const makerBalance0After = await token0.balanceOf(await maker.getAddress());
      const makerBalance1After = await token1.balanceOf(await maker.getAddress());
      expect(makerBalance0After).to.equal(makerBalance0Before);
      expect(makerBalance1After).to.equal(makerBalance1Before);
    });

    it("should handle maximum valid fee", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const maxFeeBps = 1000n; // 10% - maximum allowed
      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1, maxFeeBps);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');
      const expectedFee0 = ether('10'); // 10% of 100
      const expectedFee1 = ether('10'); // 10% of 100

      const makerBalance0Before = await token0.balanceOf(await maker.getAddress());
      const makerBalance1Before = await token1.balanceOf(await maker.getAddress());
      
      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      const makerBalance0After = await token0.balanceOf(await maker.getAddress());
      const makerBalance1After = await token1.balanceOf(await maker.getAddress());
      expect(makerBalance0After - makerBalance0Before).to.equal(expectedFee0);
      expect(makerBalance1After - makerBalance1Before).to.equal(expectedFee1);
    });

    it("should execute multiple dual flash loans in sequence", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');

      // Execute first dual flash loan
      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      // Execute second dual flash loan
      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      // Both should succeed
      expect(true).to.be.true;
    });

    it("should handle asymmetric borrow amounts", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('50');
      const borrowAmount1 = ether('500'); // Much larger

      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      expect(true).to.be.true;
    });

    it("should handle borrowing only token0 (zero amount for token1)", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = 0n;

      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      expect(true).to.be.true;
    });

    it("should handle borrowing only token1 (zero amount for token0)", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = 0n;
      const borrowAmount1 = ether('100');

      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      expect(true).to.be.true;
    });
  });

  describe("Dual Flash Loan Failures", function () {
    it("should revert when insufficient liquidity for token0", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = LIQUIDITY_AMOUNT + ether('1'); // More than available
      const borrowAmount1 = ether('100');

      await expect(
        executor.connect(owner).executeDualFlashLoan(
          await dualFlashLoan.getAddress(),
          strategy,
          borrowAmount0,
          borrowAmount1,
          "0x"
        )
      ).to.be.revertedWith('Insufficient liquidity token0');
    });

    it("should revert when insufficient liquidity for token1", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = LIQUIDITY_AMOUNT + ether('1'); // More than available

      await expect(
        executor.connect(owner).executeDualFlashLoan(
          await dualFlashLoan.getAddress(),
          strategy,
          borrowAmount0,
          borrowAmount1,
          "0x"
        )
      ).to.be.revertedWith('Insufficient liquidity token1');
    });

    it("should revert when callback returns false", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');

      // Configure executor to return false
      await executor.configure(false, true);

      await expect(
        executor.connect(owner).executeDualFlashLoan(
          await dualFlashLoan.getAddress(),
          strategy,
          borrowAmount0,
          borrowAmount1,
          "0x"
        )
      ).to.be.revertedWithCustomError(dualFlashLoan, 'DualFlashLoanFailed');
    });

    it("should revert when repayment not approved", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');

      // Configure executor to not approve repayment
      await executor.configure(true, false);

      await expect(
        executor.connect(owner).executeDualFlashLoan(
          await dualFlashLoan.getAddress(),
          strategy,
          borrowAmount0,
          borrowAmount1,
          "0x"
        )
      ).to.be.reverted; // Will fail on transferFrom
    });

    it("should revert when trying to borrow from non-existent strategy", async function () {
      const { 
        contracts: { dualFlashLoan, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      // Create strategy without shipping liquidity
      const strategy = {
        maker: await maker.getAddress(),
        token0: await token0.getAddress(),
        token1: await token1.getAddress(),
        feeBps: FEE_BPS,
        salt: ethers.keccak256(ethers.toUtf8Bytes("nonexistent"))
      };

      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');

      await expect(
        executor.connect(owner).executeDualFlashLoan(
          await dualFlashLoan.getAddress(),
          strategy,
          borrowAmount0,
          borrowAmount1,
          "0x"
        )
      ).to.be.reverted; // Will revert with SafeBalancesForTokenNotInActiveStrategy
    });

    it("should revert if token order is invalid", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      // Create strategy with reversed token order
      const strategy = {
        maker: await maker.getAddress(),
        token0: await token1.getAddress(), // Wrong order
        token1: await token0.getAddress(), // Wrong order
        feeBps: FEE_BPS,
        salt: ethers.ZeroHash
      };

      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');

      await expect(
        executor.connect(owner).executeDualFlashLoan(
          await dualFlashLoan.getAddress(),
          strategy,
          borrowAmount0,
          borrowAmount1,
          "0x"
        )
      ).to.be.revertedWithCustomError(dualFlashLoan, 'InvalidTokenOrder');
    });
  });

  describe("Reentrancy Protection", function () {
    it("should prevent reentrancy attacks", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1 },
        addrs: { maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);

      // Deploy malicious executor that tries to reenter
      const ReentrantAttacker = await ethers.getContractFactory("ReentrantDualFlashLoanAttacker");
      const attacker = await ReentrantAttacker.deploy(await dualFlashLoan.getAddress());
      await token0.mint(await attacker.getAddress(), LIQUIDITY_AMOUNT);
      await token1.mint(await attacker.getAddress(), LIQUIDITY_AMOUNT);

      await expect(
        attacker.attack(strategy, ether('100'), ether('100'))
      ).to.be.reverted; // Should revert due to reentrancy guard
    });
  });

  describe("Edge Cases", function () {
    it("should handle dual flash loan of 1 wei for each token", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = 1n;
      const borrowAmount1 = 1n;

      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      expect(true).to.be.true;
    });

    it("should handle dual flash loan of maximum available liquidity", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = LIQUIDITY_AMOUNT;
      const borrowAmount1 = LIQUIDITY_AMOUNT;

      await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      expect(true).to.be.true;
    });
  });

  describe("Liquidity Management", function () {
    it("should allow maker to withdraw liquidity after dock", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1 },
        addrs: { maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      
      // Encode strategy to get hash
      const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(address,address,address,uint256,bytes32)'],
        [[strategy.maker, strategy.token0, strategy.token1, strategy.feeBps, strategy.salt]]
      );
      const strategyHash = ethers.keccak256(encodedStrategy);

      // Dock the strategy
      await aqua.connect(maker).dock(
        await dualFlashLoan.getAddress(),
        strategyHash,
        [await token0.getAddress(), await token1.getAddress()]
      );

      // Verify liquidity is no longer accessible (strategy is inactive)
      await expect(
        dualFlashLoan.getAvailableLiquidity(strategy)
      ).to.be.reverted;
    });

    it("should prevent dual flash loans after dock is called", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      
      // Encode strategy to get hash
      const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(address,address,address,uint256,bytes32)'],
        [[strategy.maker, strategy.token0, strategy.token1, strategy.feeBps, strategy.salt]]
      );
      const strategyHash = ethers.keccak256(encodedStrategy);

      // Dock the strategy
      await aqua.connect(maker).dock(
        await dualFlashLoan.getAddress(),
        strategyHash,
        [await token0.getAddress(), await token1.getAddress()]
      );

      // Try to borrow - should fail because strategy is docked
      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');
      await expect(
        executor.connect(owner).executeDualFlashLoan(
          await dualFlashLoan.getAddress(),
          strategy,
          borrowAmount0,
          borrowAmount1,
          "0x"
        )
      ).to.be.reverted; // Will revert with SafeBalancesForTokenNotInActiveStrategy
    });
  });

  describe("Gas Benchmarking", function () {
    it("should measure gas for dual flash loan execution", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('100');
      const borrowAmount1 = ether('100');

      const tx = await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      const receipt = await tx.wait();
      console.log(`\n⛽ Gas used for dual flash loan: ${receipt?.gasUsed.toString()}`);
      
      // Should be reasonably gas efficient (less than 200k gas)
      expect(receipt?.gasUsed).to.be.lessThan(200000n);
    });

    it("should measure gas for asymmetric dual flash loan", async function () {
      const { 
        contracts: { dualFlashLoan, aqua, token0, token1, executor },
        addrs: { owner, maker }
      } = await loadFixture(deployDualFlashLoanFixture);

      const strategy = await createDualFlashLoanStrategy(dualFlashLoan, aqua, maker, token0, token1);
      const borrowAmount0 = ether('1');
      const borrowAmount1 = ether('999');

      const tx = await executor.connect(owner).executeDualFlashLoan(
        await dualFlashLoan.getAddress(),
        strategy,
        borrowAmount0,
        borrowAmount1,
        "0x"
      );

      const receipt = await tx.wait();
      console.log(`\n⛽ Gas used for asymmetric dual flash loan: ${receipt?.gasUsed.toString()}`);
    });
  });
});

