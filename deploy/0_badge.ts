import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const badge = await deploy('RewardBadge', {
    contract: 'RewardBadge',
    from: deployer,
    log: true,
  });

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

export default func;

func.tags = ['badge'];
