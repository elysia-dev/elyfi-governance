import { Contract } from '@ethersproject/contracts';

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getContract } from '../utils/deployment';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  let stakedElyfiToken: Contract;

  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, read, execute, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const badge = await getContract(hre, 'RewardBadge');
  const executor = await get('Executor');

  const args = {
    executor: executor.address,
    badge: badge.address,
  };

  const core = await deploy('ElyfiGovernanceCore', {
    contract: 'ElyfiGovernanceCore',
    skipIfAlreadyDeployed: true,
    from: deployer,
    args: Object.values(args),
    log: true,
  });

  await execute('Executor', { from: deployer, log: true }, 'init', core.address);
  await execute('RewardBadge', { from: deployer, log: true }, 'grantRole', [
    await badge.MINTER_ROLE(),
    core.address,
  ]);
  if (core.newlyDeployed) {
  }

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

export default func;

func.tags = ['core'];
func.dependencies = ['badge', 'executor'];
