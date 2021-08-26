import { ElyfiGovernanceCore, Executor } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Connector, Tokenizer, StakingPool, ERC20Test } from '@elysia-dev/contract-typechain';

import { Elyfi } from './elyfi';
import { waffle } from 'hardhat';
import { Proposal } from '../utils/proposal';

import ElyfiGovernanceCoreArtifact from '../../artifacts/contracts/core/ElyfiGovernanceCore.sol/ElyfiGovernanceCore.json';
import ExecutorArtifact from '../../artifacts/contracts/core/Executor.sol/Executor.json';

import StakingPoolV2Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/StakingPoolV2.sol/StakingPoolV2.json';
import ERC20Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/test/ERC20Test.sol/ERC20Test.json';

import { Contract, utils } from 'ethers';

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

    const elyfiToken = (await waffle.deployContract(admin, ERC20Artifact, [
      utils.parseUnits('1', 36),
      'name',
      'symbol',
    ])) as ERC20Test;

    const rewardAsset = (await waffle.deployContract(admin, ERC20Artifact, [
      utils.parseUnits('1', 36),
      'name',
      'symbol',
    ])) as ERC20Test;

    const stakedElyfiToken = (await waffle.deployContract(admin, StakingPoolV2Artifact, [
      elyfiToken.address,
      rewardAsset.address,
    ])) as Contract;

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
    await executor.grantRole(await executor.LENDING_COMPANY_ROLE(), proposer.address);
    console.log(
      '123123',
      await executor.hasRole(await executor.LENDING_COMPANY_ROLE(), proposer.address)
    );

    elyfi = undefined;

    if (setupElyfi) {
      elyfi = await Elyfi.setup(admin);
    }
    return new TestEnv(admin, proposer, core, executor, stakedElyfiToken, elyfi);
  }
}
