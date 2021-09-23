import { Contract } from '@ethersproject/contracts';

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getContract } from '../utils/deployment';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  let stakedElyfiToken: Contract;

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  stakedElyfiToken = await getContract(hre, 'StakingPoolV2');

  const args = {
    minDelay: 6400,
    proposers: [],
    executors: [],
    token: stakedElyfiToken.address,
    minVotingPower: hre.ethers.utils.parseUnits('10000', 18),
    quorumNumerator: 20,
  };

  const executor = await deploy('Executor', {
    contract: 'Executor',
    skipIfAlreadyDeployed: true,
    from: deployer,
    args: Object.values(args),
    log: true,
  });

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

export default func;
func.tags = ['executor'];
