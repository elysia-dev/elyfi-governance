import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { Connector } from '@elysia-dev/contract-typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  let args: Object;

  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const executor = await get('Executor_Test');
  const connectorDeployment = await get('Connector');
  const connector = (await hre.ethers.getContractAt(
    connectorDeployment.abi,
    connectorDeployment.address
  )) as Connector;

  args = {
    executor: executor.address,
    votingDelay: 1,
    votingPeriod: 10,
  };

  const core = await deploy('ElyfiGovernanceCore_Test', {
    contract: 'ElyfiGovernanceCoreTest',
    skipIfAlreadyDeployed: true,
    from: deployer,
    args: Object.values(args),
    log: true,
  });

  if (core.newlyDeployed) {
    await execute('Executor_Test', { from: deployer, log: true }, 'init', core.address);
    await execute('Connector', { from: deployer, log: true }, 'addCouncil', executor.address);
  }

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

export default func;

func.tags = ['core_test'];
func.dependencies = ['executor_test'];
