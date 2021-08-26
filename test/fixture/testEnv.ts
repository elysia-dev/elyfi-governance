import { ElyfiGovernanceCore, Executor } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Connector, Tokenizer, StakingPool } from '@elysia-dev/contract-typechain';

import { Elyfi } from './elyfi';
import { waffle } from 'hardhat';
import { Proposal } from '../utils/proposal';

import ElyfiGovernanceCoreArtifact from '../../artifacts/contracts/core/ElyfiGovernanceCore.sol/ElyfiGovernanceCore.json';
import ExecutorArtifact from '../../artifacts/contracts/core/Executor.sol/Executor.json';

import StakingPoolV2Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/StakingPoolV2.sol/StakingPoolV2.json';
import { Contract } from 'ethers';

export class TestEnv {
  admin: SignerWithAddress;
  proposer: SignerWithAddress;
  core: ElyfiGovernanceCore;
  executor: Executor;
  stakedElyfiToken: Contract;
  elyfi: Elyfi | undefined;

  constructor(
    admin: SignerWithAddress,
    proposer: SignerWithAddress,
    core: ElyfiGovernanceCore,
    executor: Executor,
    stakedElyfiToken: Contract,
    elyfi: Elyfi | undefined
  ) {
    this.admin = admin;
    this.proposer = proposer;
    this.core = core;
    this.executor = executor;
    this.stakedElyfiToken = stakedElyfiToken;
    this.elyfi = elyfi;
  }

  public static async setup(
    admin: SignerWithAddress,
    proposer: SignerWithAddress,
    setupElyfi?: Boolean
  ) {
    let elyfi: Elyfi | undefined;
    const stakedElyfiToken = (await waffle.deployContract(
      admin,
      StakingPoolV2Artifact,
      []
    )) as Contract;
    const executor = (await waffle.deployContract(admin, ExecutorArtifact, [
      6400,
      [],
      [],
      stakedElyfiToken.address,
    ])) as Executor;
    const core = (await waffle.deployContract(admin, ElyfiGovernanceCoreArtifact, [
      executor.address,
    ])) as ElyfiGovernanceCore;

    await executor.grantRole(await executor.PROPOSER_ROLE(), core.address);
    await executor.grantRole(await executor.EXECUTOR_ROLE(), proposer.address);

    elyfi = undefined;

    if (setupElyfi) {
      elyfi = await Elyfi.setup(admin);
    }
    return new TestEnv(admin, proposer, core, executor, stakedElyfiToken, elyfi);
  }
}
