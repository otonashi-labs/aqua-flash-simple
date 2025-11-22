// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { ethers } from 'hardhat';

/**
 * Simple script to check your wallet balance on Sepolia
 */
async function main() {
    console.log('🔍 Checking Sepolia Wallet Balance\n');

    const [deployer] = await ethers.getSigners();
    const address = await deployer.getAddress();
    
    console.log('👤 Wallet Address:', address);
    console.log('   Check on Etherscan:', `https://sepolia.etherscan.io/address/${address}\n`);
    
    const balance = await ethers.provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log('💰 Balance:', balanceInEth, 'ETH\n');

    // Check if sufficient for deployment
    const minRequired = ethers.parseEther('0.01');
    const recommended = ethers.parseEther('0.08');
    
    if (balance < minRequired) {
        console.log('❌ INSUFFICIENT BALANCE');
        console.log('   You need at least 0.01 ETH for deployment');
        console.log('   Get Sepolia ETH from: https://sepoliafaucet.com/\n');
    } else if (balance < recommended) {
        console.log('⚠️  LOW BALANCE');
        console.log('   You have enough, but 0.08 ETH is recommended for safety');
        console.log('   Get more from: https://sepoliafaucet.com/\n');
    } else {
        console.log('✅ SUFFICIENT BALANCE');
        console.log('   You have enough ETH for deployment and testing\n');
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log('🌐 Network Info:');
    console.log('   Name:', network.name);
    console.log('   Chain ID:', network.chainId.toString());
    
    if (network.chainId === 11155111n) {
        console.log('   ✅ Correct network (Sepolia)');
    } else {
        console.log('   ❌ Wrong network! Expected Sepolia (11155111)');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

