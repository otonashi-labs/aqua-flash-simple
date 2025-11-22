// Script to execute a real dual flash loan on Sepolia

import { ethers } from 'hardhat';

const SEPOLIA_ADDRESSES = {
    aqua: "0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF",
    dualFlashLoan: "0x91B97b0e887C914AC97C7cD937FEAb11EdCeBdc8",
    dualFlashLoanExecutor: "0xfe2D77D038e05B8de20adb15b05a894AF00081a0",
};

async function main() {
    console.log('🚀 Starting Dual Flash Loan Execution on Sepolia...\n');

    const [deployer] = await ethers.getSigners();
    console.log('Using account:', deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Balance:', ethers.formatEther(balance), 'ETH\n');

    // Get contract instances
    console.log('📦 Loading contracts...');
    const aqua = await ethers.getContractAt('Aqua', SEPOLIA_ADDRESSES.aqua);
    const dualFlashLoan = await ethers.getContractAt('DualFlashLoan', SEPOLIA_ADDRESSES.dualFlashLoan);
    const executor = await ethers.getContractAt('DualFlashLoanExecutor', SEPOLIA_ADDRESSES.dualFlashLoanExecutor);
    
    // Verify connections
    const aquaFromContract = await dualFlashLoan.AQUA();
    console.log('✅ DualFlashLoan connected to Aqua:', aquaFromContract);
    console.log('✅ Executor owner:', await executor.owner());

    // Step 1: Deploy test tokens
    console.log('\n📝 Step 1: Deploying test tokens...');
    const TokenMock = await ethers.getContractFactory('TokenMock');
    
    const tokenA = await TokenMock.deploy('Token A', 'TKA');
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log('Token A deployed:', tokenAAddress);
    
    const tokenB = await TokenMock.deploy('Token B', 'TKB');
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log('Token B deployed:', tokenBAddress);

    // Ensure token ordering (token0 < token1)
    const [token0Address, token1Address, token0, token1] = 
        tokenAAddress < tokenBAddress 
            ? [tokenAAddress, tokenBAddress, tokenA, tokenB]
            : [tokenBAddress, tokenAAddress, tokenB, tokenA];
    
    console.log('\n✅ Token ordering:');
    console.log('  token0:', token0Address);
    console.log('  token1:', token1Address);

    // Step 2: Mint tokens to maker (deployer) and executor
    console.log('\n📝 Step 2: Minting tokens...');
    const LIQUIDITY_AMOUNT = ethers.parseEther('1000');
    
    const mintTx1 = await token0.mint(deployer.address, LIQUIDITY_AMOUNT);
    await mintTx1.wait();
    console.log('✅ Minted 1000 token0 to maker');
    
    const mintTx2 = await token1.mint(deployer.address, LIQUIDITY_AMOUNT);
    await mintTx2.wait();
    console.log('✅ Minted 1000 token1 to maker');
    
    const mintTx3 = await token0.mint(SEPOLIA_ADDRESSES.dualFlashLoanExecutor, LIQUIDITY_AMOUNT);
    await mintTx3.wait();
    console.log('✅ Minted 1000 token0 to executor');
    
    const mintTx4 = await token1.mint(SEPOLIA_ADDRESSES.dualFlashLoanExecutor, LIQUIDITY_AMOUNT);
    await mintTx4.wait();
    console.log('✅ Minted 1000 token1 to executor');

    // Step 3: Approve Aqua to spend tokens
    console.log('\n📝 Step 3: Approving Aqua...');
    const approveTx1 = await token0.approve(SEPOLIA_ADDRESSES.aqua, ethers.MaxUint256);
    await approveTx1.wait();
    console.log('✅ Approved token0');
    
    const approveTx2 = await token1.approve(SEPOLIA_ADDRESSES.aqua, ethers.MaxUint256);
    await approveTx2.wait();
    console.log('✅ Approved token1');

    // Step 4: Create strategy and ship liquidity
    console.log('\n📝 Step 4: Creating strategy and shipping liquidity...');
    const strategy = {
        maker: deployer.address,
        token0: token0Address,
        token1: token1Address,
        feeBps: 9, // 0.09% fee
        salt: ethers.ZeroHash
    };

    const encodedStrategy = ethers.AbiCoder.defaultAbiCoder().encode(
        ['tuple(address,address,address,uint256,bytes32)'],
        [[strategy.maker, strategy.token0, strategy.token1, strategy.feeBps, strategy.salt]]
    );

    console.log('Strategy:', {
        maker: strategy.maker,
        token0: strategy.token0,
        token1: strategy.token1,
        feeBps: strategy.feeBps.toString(),
        salt: strategy.salt
    });

    const shipTx = await aqua.ship(
        SEPOLIA_ADDRESSES.dualFlashLoan,
        encodedStrategy,
        [token0Address, token1Address],
        [LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT]
    );
    
    console.log('📤 Shipping liquidity... TX:', shipTx.hash);
    await shipTx.wait();
    console.log('✅ Liquidity shipped!');

    // Step 5: Check available liquidity
    console.log('\n📝 Step 5: Checking available liquidity...');
    const [liquidity0, liquidity1] = await dualFlashLoan.getAvailableLiquidity(strategy);
    console.log('Available liquidity0:', ethers.formatEther(liquidity0));
    console.log('Available liquidity1:', ethers.formatEther(liquidity1));

    // Step 6: Execute dual flash loan!
    console.log('\n📝 Step 6: Executing DUAL FLASH LOAN! 🚀');
    
    const borrowAmount0 = ethers.parseEther('100'); // Borrow 100 token0
    const borrowAmount1 = ethers.parseEther('200'); // Borrow 200 token1
    
    console.log('Borrowing:');
    console.log('  token0:', ethers.formatEther(borrowAmount0));
    console.log('  token1:', ethers.formatEther(borrowAmount1));
    
    const fee0 = await dualFlashLoan.calculateFee(strategy, borrowAmount0);
    const fee1 = await dualFlashLoan.calculateFee(strategy, borrowAmount1);
    
    console.log('Fees:');
    console.log('  fee0:', ethers.formatEther(fee0), `(${strategy.feeBps} bps)`);
    console.log('  fee1:', ethers.formatEther(fee1), `(${strategy.feeBps} bps)`);

    // Get balances before
    const makerBalance0Before = await token0.balanceOf(deployer.address);
    const makerBalance1Before = await token1.balanceOf(deployer.address);
    
    console.log('\nMaker balances before:');
    console.log('  token0:', ethers.formatEther(makerBalance0Before));
    console.log('  token1:', ethers.formatEther(makerBalance1Before));

    // Execute the dual flash loan
    const flashLoanTx = await executor.executeDualFlashLoan(
        SEPOLIA_ADDRESSES.dualFlashLoan,
        strategy,
        borrowAmount0,
        borrowAmount1,
        '0x'
    );
    
    console.log('\n⚡ Executing flash loan... TX:', flashLoanTx.hash);
    const receipt = await flashLoanTx.wait();
    console.log('✅ Flash loan executed!');
    console.log('⛽ Gas used:', receipt?.gasUsed.toString());

    // Get balances after
    const makerBalance0After = await token0.balanceOf(deployer.address);
    const makerBalance1After = await token1.balanceOf(deployer.address);
    
    console.log('\n📊 Results:');
    console.log('Maker balances after:');
    console.log('  token0:', ethers.formatEther(makerBalance0After));
    console.log('  token1:', ethers.formatEther(makerBalance1After));
    
    console.log('\nFees earned by maker:');
    console.log('  token0:', ethers.formatEther(makerBalance0After - makerBalance0Before));
    console.log('  token1:', ethers.formatEther(makerBalance1After - makerBalance1Before));

    // Verify the event
    const events = receipt?.logs || [];
    console.log('\n📢 Events emitted:', events.length);
    
    // Check for DualFlashLoanExecuted event
    const dualFlashLoanInterface = dualFlashLoan.interface;
    for (const log of events) {
        try {
            const parsed = dualFlashLoanInterface.parseLog({
                topics: [...log.topics],
                data: log.data
            });
            if (parsed?.name === 'DualFlashLoanExecuted') {
                console.log('\n✨ DualFlashLoanExecuted event:');
                console.log('  maker:', parsed.args.maker);
                console.log('  borrower:', parsed.args.borrower);
                console.log('  token0:', parsed.args.token0);
                console.log('  token1:', parsed.args.token1);
                console.log('  amount0:', ethers.formatEther(parsed.args.amount0));
                console.log('  amount1:', ethers.formatEther(parsed.args.amount1));
                console.log('  fee0:', ethers.formatEther(parsed.args.fee0));
                console.log('  fee1:', ethers.formatEther(parsed.args.fee1));
            }
        } catch (e) {
            // Not our event, skip
        }
    }

    console.log('\n🎉 SUCCESS! Dual flash loan executed on Sepolia!');
    console.log('\n📝 Summary:');
    console.log('==================================================');
    console.log('Network:           Sepolia');
    console.log('DualFlashLoan:     ', SEPOLIA_ADDRESSES.dualFlashLoan);
    console.log('Executor:          ', SEPOLIA_ADDRESSES.dualFlashLoanExecutor);
    console.log('Token0:            ', token0Address);
    console.log('Token1:            ', token1Address);
    console.log('Amount0 borrowed:  ', ethers.formatEther(borrowAmount0));
    console.log('Amount1 borrowed:  ', ethers.formatEther(borrowAmount1));
    console.log('Fee0 paid:         ', ethers.formatEther(fee0));
    console.log('Fee1 paid:         ', ethers.formatEther(fee1));
    console.log('Gas used:          ', receipt?.gasUsed.toString());
    console.log('TX:                ', flashLoanTx.hash);
    console.log('==================================================');
    console.log('\n🔗 View on Etherscan:');
    console.log(`https://sepolia.etherscan.io/tx/${flashLoanTx.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

