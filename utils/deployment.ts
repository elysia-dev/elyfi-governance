import { HardhatRuntimeEnvironment } from 'hardhat/types';

export async function isDeployed(deployments: any, name: string): Promise<boolean> {
  let contract = await deployments.getOrNull(name);
  return contract && contract.address != null;
}

export const getContract = async (hre: HardhatRuntimeEnvironment, contract: string) => {
  const { deployments } = hre;
  const { get } = deployments;

  const deployment = await get(contract);
  return await hre.ethers.getContractAt(deployment.abi, deployment.address);
};
