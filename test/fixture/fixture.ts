import { ElyfiGovernanceCore, Executor } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { StakingPool, Connector, Tokenizer } from '@elysia-dev/contract-typechain';
import { Elyfi } from './elyfi';
import { waffle } from 'hardhat';
import { Proposal } from '../utils/proposal';

import ElyfiGovernanceCoreArtifact from '../../artifacts/contracts/core/ElyfiGovernanceCore.sol/ElyfiGovernanceCore.json';
import ExecutorArtifact from '../../artifacts/contracts/core/Executor.sol/Executor.json';

export class TestEnv {
  admin: SignerWithAddress;
  core: ElyfiGovernanceCore;
  executor: Executor;
  stakingPool: StakingPool;
  elyfi: Elyfi;

  constructor(
    admin: SignerWithAddress,
    core: ElyfiGovernanceCore,
    executor: Executor,
    stakingPool: StakingPool,
    elyfi: Elyfi
  ) {
    this.admin = admin;
    this.core = core;
    this.executor = executor;
    this.stakingPool = stakingPool;
    this.elyfi = elyfi;
  }

  public static async setup(admin: SignerWithAddress, setupElyfi?: Boolean) {
    let elyfi: Elyfi;
    const stakingPool = (await waffle.deployContract(admin)) as StakingPool;
    const executor = (await waffle.deployContract(admin, ExecutorArtifact)) as Executor;
    const core = (await waffle.deployContract(
      admin,
      ElyfiGovernanceCoreArtifact,
      []
    )) as ElyfiGovernanceCore;

    if (setupElyfi) {
      elyfi = await Elyfi.setup(admin);
    }
    return new TestEnv(admin, core, executor, stakingPool, elyfi);
  }
}
