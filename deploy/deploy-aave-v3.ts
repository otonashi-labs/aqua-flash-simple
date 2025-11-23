import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

/**
 * Deployment script for AaveV3FlashLoanExecutor
 * 
 * This deploys a minimal flash loan executor for Aave V3 on Sepolia
 * for gas comparison purposes.
 * 
 * Aave V3 Sepolia Pool Address: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
 * Reference: https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // Aave V3 Pool addresses by network
  const AAVE_V3_POOL_ADDRESSES: { [key: string]: string } = {
    sepolia: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    mainnet: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  };

  const poolAddress = AAVE_V3_POOL_ADDRESSES[network.name];

  if (!poolAddress) {
    throw new Error(`Aave V3 Pool address not configured for network: ${network.name}`);
  }

  log(`Deploying AaveV3FlashLoanExecutor on ${network.name}...`);
  log(`Using Aave V3 Pool at: ${poolAddress}`);

  const deployment = await deploy('AaveV3FlashLoanExecutor', {
    from: deployer,
    args: [poolAddress],
    log: true,
    waitConfirmations: network.name === 'sepolia' ? 6 : 1,
  });

  log(`AaveV3FlashLoanExecutor deployed at: ${deployment.address}`);
  log(`Transaction hash: ${deployment.transactionHash}`);
  log(`Gas used: ${deployment.receipt?.gasUsed?.toString() || 'N/A'}`);

  // Log deployment info for verification
  if (network.name === 'sepolia') {
    log('');
    log('To verify on Etherscan, run:');
    log(`npx hardhat verify --network sepolia ${deployment.address} ${poolAddress}`);
  }

  return true;
};

func.tags = ['AaveV3FlashLoanExecutor', 'aave'];
func.id = 'deploy_aave_v3_flash_loan_executor';

export default func;

