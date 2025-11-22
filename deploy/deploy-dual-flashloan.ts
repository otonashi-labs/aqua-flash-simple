// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { deployAndGetContract } from '@1inch/solidity-utils';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: any) {
    const { getNamedAccounts, deployments, ethers } = hre;

    console.log('Starting DualFlashLoan deployment...\n');

    // Get deployer address
    const { deployer } = await getNamedAccounts();

    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;

    console.log('Network:', chainId.toString());
    console.log('Deployer address:', deployer);

    // Use existing Aqua contract address
    const EXISTING_AQUA_ADDRESS = '0x97f393EbbF5f7ab0DFB0C04cea7FF0Ca5D13F3EF';
    console.log('Using existing Aqua at:', EXISTING_AQUA_ADDRESS);

    // Deploy DualFlashLoan contract
    console.log('\n🚀 Deploying DualFlashLoan contract...');
    const dualFlashLoan = await deployAndGetContract({
        contractName: 'DualFlashLoan',
        constructorArgs: [EXISTING_AQUA_ADDRESS],
        deployer: deployer,
        deployments,
        skipVerify: false, // Enable verification
    });
    const dualFlashLoanAddress = await dualFlashLoan.getAddress();
    console.log('✅ DualFlashLoan deployed to:', dualFlashLoanAddress);

    // Deploy DualFlashLoanExecutor for testing
    console.log('\n🚀 Deploying DualFlashLoanExecutor contract...');
    const dualFlashLoanExecutor = await deployAndGetContract({
        contractName: 'DualFlashLoanExecutor',
        constructorArgs: [],
        deployer: deployer,
        deployments,
        skipVerify: false, // Enable verification
    });
    const dualFlashLoanExecutorAddress = await dualFlashLoanExecutor.getAddress();
    console.log('✅ DualFlashLoanExecutor deployed to:', dualFlashLoanExecutorAddress);

    console.log('\n✅ Deployment completed successfully!');
    console.log('\n📝 Deployment Summary:');
    console.log('==================================================');
    console.log('Existing Contracts:');
    console.log('  Aqua:               ', EXISTING_AQUA_ADDRESS);
    console.log('  XYCSwap:            ', '0xBE99E116e716bB91c504Be90c5bAe0e8FC1ad3fA');
    console.log('  FlashLoan:          ', '0x06a2502F9dBfe18d414c6432C4c2bb70aD44C3a3');
    console.log('  FlashLoanExecutor:  ', '0x6B4101AfD6FD5C050Ea2293E9E625c78C5be8090');
    console.log('\nNewly Deployed:');
    console.log('  DualFlashLoan:      ', dualFlashLoanAddress);
    console.log('  DualFlashLoanExecutor:', dualFlashLoanExecutorAddress);
    console.log('==================================================');

    // Verification instructions
    console.log('\n📋 Verification Status:');
    console.log('Contracts will be automatically verified on Etherscan.');
    console.log('If verification fails, you can manually verify with:');
    console.log('\nDualFlashLoan:');
    console.log(`npx hardhat verify --network sepolia ${dualFlashLoanAddress} ${EXISTING_AQUA_ADDRESS}`);
    console.log('\nDualFlashLoanExecutor:');
    console.log(`npx hardhat verify --network sepolia ${dualFlashLoanExecutorAddress}`);
};

export default func;
func.tags = ['DualFlashLoan'];

