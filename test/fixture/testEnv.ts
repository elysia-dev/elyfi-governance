import { ElyfiGovernanceCore, ERC20Votes, Executor } from '../../typechain';

import { Connector, Tokenizer, StakingPool, ERC20Test } from '@elysia-dev/contract-typechain';

import { Elyfi } from './elyfi';
import { waffle } from 'hardhat';
import { Proposal } from '../utils/proposal';

import ElyfiGovernanceCoreArtifact from '../../artifacts/contracts/core/ElyfiGovernanceCore.sol/ElyfiGovernanceCore.json';
import ExecutorArtifact from '../../artifacts/contracts/core/Executor.sol/Executor.json';

import StakingPoolV2Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/StakingPoolV2.sol/StakingPoolV2.json';
import ERC20Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/test/ERC20Test.sol/ERC20Test.json';

import { Contract, utils, Wallet } from 'ethers';
import { VoteType } from '../utils/enum';

import { Event } from '@ethersproject/contracts';

import { Result } from '@ethersproject/abi';
import { advanceBlock } from '../utils/time';

export class TestEnv {
  admin: Wallet;
  core: ElyfiGovernanceCore;
  executor: Executor;
  elyfiToken: ERC20Test;
  stakedElyfiToken: Contract;
  elyfi: Elyfi | undefined;
  nonce: number;

  constructor(
    admin: Wallet,
    core: ElyfiGovernanceCore,
    executor: Executor,
    elyfiToken: ERC20Test,
    stakedElyfiToken: Contract,
    elyfi: Elyfi | undefined
  ) {
    this.admin = admin;
    this.core = core;
    this.executor = executor;
    this.elyfiToken = elyfiToken;
    this.stakedElyfiToken = stakedElyfiToken;
    this.elyfi = elyfi;
    this.nonce = 0;
  }

  public async setVoters(accounts: Wallet[]) {
    for (let account of accounts) {
      await this.elyfiToken.connect(account).faucet();
      const balance = await this.elyfiToken.balanceOf(account.address);
      await this.elyfiToken.connect(account).approve(this.stakedElyfiToken.address, balance);
      await this.stakedElyfiToken.connect(account).stake(balance);
      await this.stakedElyfiToken.connect(account).delegate(account.address);
    }
  }

  public async setProposers(accounts: Wallet[]) {
    for (let account of accounts) {
      await this.executor
        .connect(this.admin)
        .grantRole(await this.executor.LENDING_COMPANY_ROLE(), account.address);
    }
  }

  public async propose(proposer: Wallet, proposal: Proposal) {
    const createdProposal = { ...proposal } as Proposal;

    const proposalTx = await this.core
      .connect(proposer)
      .propose(proposal.targets, proposal.values, proposal.callDatas, proposal.description);

    const events = (await proposalTx.wait()).events as Array<Event>;
    const result = events[0].args as Result;

    createdProposal.id = result['proposalId'];
    createdProposal.startBlock = result['startBlock'];
    createdProposal.endBlock = result['endBlock'];

    await advanceBlock();
    await advanceBlock();

    this.nonce++;

    return createdProposal;
  }

  public static async setup(admin: Wallet, setupElyfi?: Boolean) {
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
    ])) as ERC20Votes;

    const executor = (await waffle.deployContract(admin, ExecutorArtifact, [
      6400,
      [],
      [],
      stakedElyfiToken.address,
    ])) as Executor;

    const core = (await waffle.deployContract(admin, ElyfiGovernanceCoreArtifact, [
      executor.address,
    ])) as ElyfiGovernanceCore;

    await executor.init(core.address);

    console.log(executor.address);

    elyfi = undefined;

    if (setupElyfi) {
      elyfi = await Elyfi.setup(admin);
    }
    return new TestEnv(admin, core, executor, elyfiToken, stakedElyfiToken, elyfi);
  }
}
