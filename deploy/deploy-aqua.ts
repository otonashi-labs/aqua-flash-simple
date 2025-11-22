// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

import { deployAndGetContract } from '@1inch/solidity-utils';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: any) {
    const { getNamedAccounts, deployments, ethers } = hre;

    console.log('Starting Aqua deployment...\n');

    // Get deployer address (returns a string)
    const { deployer } = await getNamedAccounts();

    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;

    console.log('Network:', chainId.toString());
    console.log('Deployer address:', deployer);

    // Deploy Aqua contract
    console.log('Deploying Aqua contract...');
    const aqua = await deployAndGetContract({
        contractName: 'Aqua',
        constructorArgs: [],
        deployer,
        deployments,
        skipVerify: true,
    });
    const aquaAddress = await aqua.getAddress();
    console.log('Aqua deployed to:', aquaAddress);

    // Deploy XYCSwap contract
    console.log('\nDeploying XYCSwap contract...');
    const xycSwap = await deployAndGetContract({
        contractName: 'XYCSwap',
        constructorArgs: [aquaAddress],
        deployer: deployer,
        deployments,
        skipVerify: true,
    });
    const xycSwapAddress = await xycSwap.getAddress();
    console.log('XYCSwap deployed to:', xycSwapAddress);

    // Deploy FlashLoan contract
    console.log('\nDeploying FlashLoan contract...');
    const flashLoan = await deployAndGetContract({
        contractName: 'FlashLoan',
        constructorArgs: [aquaAddress],
        deployer: deployer,
        deployments,
        skipVerify: true,
    });
    const flashLoanAddress = await flashLoan.getAddress();
    console.log('FlashLoan deployed to:', flashLoanAddress);

    // Deploy FlashLoanExecutor for testing
    console.log('\nDeploying FlashLoanExecutor contract...');
    const flashLoanExecutor = await deployAndGetContract({
        contractName: 'FlashLoanExecutor',
        constructorArgs: [],
        deployer: deployer,
        deployments,
        skipVerify: true,
    });
    const flashLoanExecutorAddress = await flashLoanExecutor.getAddress();
    console.log('FlashLoanExecutor deployed to:', flashLoanExecutorAddress);

    // Deploy DualFlashLoan contract
    console.log('\nDeploying DualFlashLoan contract...');
    const dualFlashLoan = await deployAndGetContract({
        contractName: 'DualFlashLoan',
        constructorArgs: [aquaAddress],
        deployer: deployer,
        deployments,
        skipVerify: true,
    });
    const dualFlashLoanAddress = await dualFlashLoan.getAddress();
    console.log('DualFlashLoan deployed to:', dualFlashLoanAddress);

    // Deploy DualFlashLoanExecutor for testing
    console.log('\nDeploying DualFlashLoanExecutor contract...');
    const dualFlashLoanExecutor = await deployAndGetContract({
        contractName: 'DualFlashLoanExecutor',
        constructorArgs: [],
        deployer: deployer,
        deployments,
        skipVerify: true,
    });
    const dualFlashLoanExecutorAddress = await dualFlashLoanExecutor.getAddress();
    console.log('DualFlashLoanExecutor deployed to:', dualFlashLoanExecutorAddress);

    // Deploy SwapExecutor (resolver) contract only if DEPLOY_RESOLVER is set
    if (process.env.DEPLOY_RESOLVER === 'true') {
        console.log('\nDeploying SwapExecutor contract...');
        const swapExecutor = await deployAndGetContract({
            contractName: 'SwapExecutor',
            constructorArgs: [aquaAddress],
            deployer: deployer,
            deployments,
            skipVerify: true,
        });
        const swapExecutorAddress = await swapExecutor.getAddress();
        console.log('SwapExecutor deployed to:', swapExecutorAddress);
    } else {
        console.log('\nSkipping SwapExecutor deployment (set DEPLOY_RESOLVER=true to deploy)');
    }

    console.log('\n✅ Deployment completed successfully!');
    console.log('\n📝 Deployment Summary:');
    console.log('==================================================');
    console.log('Aqua:', aquaAddress);
    console.log('XYCSwap:', xycSwapAddress);
    console.log('FlashLoan:', flashLoanAddress);
    console.log('FlashLoanExecutor:', flashLoanExecutorAddress);
    console.log('DualFlashLoan:', dualFlashLoanAddress);
    console.log('DualFlashLoanExecutor:', dualFlashLoanExecutorAddress);
    console.log('==================================================');
};

export default func;
func.tags = ['Aqua'];
