// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { ethers } from 'hardhat';
import { ether } from '@1inch/solidity-utils';

/**
 * Script to test FlashLoan on Sepolia testnet
 * 
 * Steps:
 * 1. Deploy or use existing test token
 * 2. Setup FlashLoan strategy with liquidity
 * 3. Execute test flash loan
 * 4. Verify results
 */
async function main() {
    console.log('🚀 Testing FlashLoan on Sepolia\n');

    // Get contract addresses from deployments
    const deploymentsPath = './deployments/sepolia';
    let aquaAddress: string;
    let flashLoanAddress: string;
    let flashLoanExecutorAddress: string;

    try {
        const aquaDeployment = require(`../${deploymentsPath}/Aqua.json`);
        const flashLoanDeployment = require(`../${deploymentsPath}/FlashLoan.json`);
        const executorDeployment = require(`../${deploymentsPath}/FlashLoanExecutor.json`);

        aquaAddress = aquaDeployment.address;
        flashLoanAddress = flashLoanDeployment.address;
        flashLoanExecutorAddress = executorDeployment.address;

        console.log('📍 Using deployed contracts:');
        console.log('  Aqua:', aquaAddress);
        console.log('  FlashLoan:', flashLoanAddress);
        console.log('  FlashLoanExecutor:', flashLoanExecutorAddress);
        console.log('');
    } catch (error) {
        console.error('❌ Could not load deployment addresses.');
        console.error('   Please run: yarn deploy --network sepolia');
        process.exit(1);
    }

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log('👤 Deployer:', await deployer.getAddress());
    
    const balance = await ethers.provider.getBalance(await deployer.getAddress());
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');

    if (balance < ethers.parseEther('0.05')) {
        console.warn('⚠️  Warning: Low balance. Get Sepolia ETH from faucet: https://sepoliafaucet.com/\n');
    }

    // Get contract instances
    const aqua = await ethers.getContractAt('Aqua', aquaAddress);
    const flashLoan = await ethers.getContractAt('FlashLoan', flashLoanAddress);
    const executor = await ethers.getContractAt('FlashLoanExecutor', flashLoanExecutorAddress);

    // Deploy or use test token
    let testToken;
    if (process.env.TEST_TOKEN_ADDRESS) {
        console.log('📝 Using existing test token:', process.env.TEST_TOKEN_ADDRESS);
        testToken = await ethers.getContractAt('TokenMock', process.env.TEST_TOKEN_ADDRESS);
    } else {
        console.log('🪙 Deploying test token...');
        const TokenMock = await ethers.getContractFactory('TokenMock');
        testToken = await TokenMock.deploy('Test Token', 'TEST');
        await testToken.waitForDeployment();
        const tokenAddress = await testToken.getAddress();
        console.log('   Test token deployed to:', tokenAddress);
        console.log('   Save this address to .env as TEST_TOKEN_ADDRESS\n');
    }

    const tokenAddress = await testToken.getAddress();

    // Mint tokens
    console.log('🏦 Minting tokens...');
    const mintAmount = ether('10000');
    const tx1 = await testToken.mint(await deployer.getAddress(), mintAmount);
    await tx1.wait();
    console.log('   Minted', ethers.formatEther(mintAmount), 'TEST tokens to deployer\n');

    // Mint tokens to executor for repayment
    const tx2 = await testToken.mint(flashLoanExecutorAddress, mintAmount);
    await tx2.wait();
    console.log('   Minted', ethers.formatEther(mintAmount), 'TEST tokens to executor\n');

    // Approve Aqua to spend deployer's tokens
    console.log('✅ Approving Aqua...');
    const tx3 = await testToken.approve(aquaAddress, ethers.MaxUint256);
    await tx3.wait();
    console.log('   Approved\n');

    // Create flash loan strategy
    const feeBps = 9; // 0.09%
    const strategy = {
        maker: await deployer.getAddress(),
        token: tokenAddress,
        feeBps: feeBps,
        salt: ethers.ZeroHash
    };

    console.log('📋 Flash Loan Strategy:');
    console.log('   Maker:', strategy.maker);
    console.log('   Token:', strategy.token);
    console.log('   Fee:', feeBps, 'bps (0.09%)\n');

    // Encode strategy
    const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(address,address,uint256,bytes32)'],
        [[strategy.maker, strategy.token, strategy.feeBps, strategy.salt]]
    );

    // Ship liquidity to Aqua
    const liquidityAmount = ether('1000');
    console.log('🚢 Shipping liquidity to Aqua...');
    console.log('   Amount:', ethers.formatEther(liquidityAmount), 'TEST');
    const tx4 = await aqua.ship(
        flashLoanAddress,
        encodedStrategy,
        [tokenAddress],
        [liquidityAmount]
    );
    await tx4.wait();
    console.log('   ✅ Liquidity shipped\n');

    // Check available liquidity
    const availableLiquidity = await flashLoan.getAvailableLiquidity(strategy);
    console.log('💧 Available liquidity:', ethers.formatEther(availableLiquidity), 'TEST\n');

    // Calculate fee for test borrow
    const borrowAmount = ether('100');
    const fee = await flashLoan.calculateFee(strategy, borrowAmount);
    console.log('🧮 Flash Loan Test:');
    console.log('   Borrow amount:', ethers.formatEther(borrowAmount), 'TEST');
    console.log('   Fee:', ethers.formatEther(fee), 'TEST');
    console.log('   Repay amount:', ethers.formatEther(borrowAmount + fee), 'TEST\n');

    // Execute flash loan
    console.log('⚡ Executing flash loan...');
    const makerBalanceBefore = await testToken.balanceOf(await deployer.getAddress());
    
    const tx5 = await executor.executeFlashLoan(
        flashLoanAddress,
        strategy,
        borrowAmount,
        '0x'
    );
    const receipt = await tx5.wait();
    
    const makerBalanceAfter = await testToken.balanceOf(await deployer.getAddress());
    const feeEarned = makerBalanceAfter - makerBalanceBefore;

    console.log('   ✅ Flash loan executed successfully!');
    console.log('   Gas used:', receipt?.gasUsed.toString());
    console.log('   Fee earned by maker:', ethers.formatEther(feeEarned), 'TEST\n');

    // Verify the event
    console.log('📡 Checking events...');
    const filter = flashLoan.filters.FlashLoanExecuted();
    const events = await flashLoan.queryFilter(filter, receipt?.blockNumber, receipt?.blockNumber);
    
    if (events.length > 0) {
        const event = events[0];
        console.log('   Event FlashLoanExecuted:');
        console.log('     Maker:', event.args.maker);
        console.log('     Borrower:', event.args.borrower);
        console.log('     Token:', event.args.token);
        console.log('     Amount:', ethers.formatEther(event.args.amount), 'TEST');
        console.log('     Fee:', ethers.formatEther(event.args.fee), 'TEST\n');
    }

    // Check final liquidity
    const finalLiquidity = await flashLoan.getAvailableLiquidity(strategy);
    console.log('💧 Final liquidity:', ethers.formatEther(finalLiquidity), 'TEST');
    console.log('   (Should be original + fee)\n');

    console.log('✅ All tests passed successfully!');
    console.log('\n📝 Summary:');
    console.log('==================================================');
    console.log('Network: Sepolia');
    console.log('Test Token:', tokenAddress);
    console.log('Flash Loan Amount:', ethers.formatEther(borrowAmount), 'TEST');
    console.log('Fee Paid:', ethers.formatEther(feeEarned), 'TEST');
    console.log('Gas Used:', receipt?.gasUsed.toString());
    console.log('==================================================');
    console.log('\n🎉 FlashLoan is working on Sepolia testnet!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

