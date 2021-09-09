import { Contract } from '@ethersproject/contracts';

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  let stakedElyfiToken: Contract;

  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, read, execute, getOrNull, log } = deployments;
  const { deployer } = await getNamedAccounts();

  stakedElyfiToken = await getToken();

  const executor = await get('Executor');

  const args = {
    executor: executor.address,
  };

  const core = await deploy('ElyfiGovernanceCore', {
    contract: 'ElyfiGovernanceCore',
    skipIfAlreadyDeployed: true,
    from: deployer,
    args: Object.values(args),
    log: true,
  });

  if (core.newlyDeployed) {
    await execute('Executor', { from: deployer, log: true }, 'init', core.address);
  }
};

export default func;

func.tags = ['core'];
func.dependencies = ['executor'];
