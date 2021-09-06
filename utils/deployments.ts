import { Contract } from '@ethersproject/contracts';

export async function isDeployed(deployments: any, name: string): Promise<boolean> {
  let contract = await deployments.getOrNull(name);
  return contract && contract.address != null;
}

export async function getToken(): Promise<Contract> {}
