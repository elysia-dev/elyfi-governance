import { ElyfiGovernanceCoreTest, Executor, RewardBadge } from '../../typechain';

import { ERC20Test } from '@elysia-dev/contract-typechain';

import { waffle } from 'hardhat';
import { Proposal } from '../utils/proposal';

import ElyfiGovernanceCoreTestArtifact from '../../artifacts/contracts/test/ElyfiGovernanceCoreTest.sol/ElyfiGovernanceCoreTest.json';
import ExecutorArtifact from '../../artifacts/contracts/core/Executor.sol/Executor.json';

import StakingPoolV2Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/StakingPoolV2.sol/StakingPoolV2.json';
import ERC20Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/test/ERC20Test.sol/ERC20Test.json';

import { BigNumber, Contract, utils, Wallet } from 'ethers';
import { ProposalState } from '../utils/enum';

import { Event } from '@ethersproject/contracts';
import { expect } from 'chai';

import { Result } from '@ethersproject/abi';
import { advanceBlock, advanceTimeTo, getTimestamp, toTimestamp } from '../utils/time';
import { formatBytesString } from '../utils/bytes';

export class TestEnv {
  admin: Wallet;
  core: ElyfiGovernanceCoreTest;
  executor: Executor;
  elyfiToken: ERC20Test;
  stakedElyfiToken: Contract;

  constructor(
    admin: Wallet,
    core: ElyfiGovernanceCoreTest,
    executor: Executor,
    elyfiToken: ERC20Test,
    stakedElyfiToken: Contract
  ) {
    this.admin = admin;
    this.core = core;
    this.executor = executor;
    this.elyfiToken = elyfiToken;
    this.stakedElyfiToken = stakedElyfiToken;
  }

  public async setVoters(accounts: Wallet[]) {
    for (let account of accounts) {
      await this.elyfiToken.connect(account).faucet();
      const balance = await this.elyfiToken.balanceOf(account.address);
      const tx = await this.elyfiToken
        .connect(account)
        .approve(this.stakedElyfiToken.address, balance);
      const txtx = await this.stakedElyfiToken.connect(account).stake(balance);
      await this.stakedElyfiToken.connect(account).delegate(account.address);
    }
  }

  public async setStakers(accounts: Wallet[]) {
    for (let account of accounts) {
      await this.elyfiToken.connect(account).faucet();
      const balance = await this.elyfiToken.balanceOf(account.address);
      await this.elyfiToken.connect(account).approve(this.stakedElyfiToken.address, balance);
      await this.stakedElyfiToken.connect(account).stake(balance);
    }
  }

  public async setProposers(accounts: Wallet[]) {
    for (let account of accounts) {
      await this.executor
        .connect(this.admin)
        .grantRole(await this.executor.LENDING_COMPANY_ROLE(), account.address);
    }
  }

  public async expectProposalState(proposal: Proposal, state: ProposalState) {
    const proposalState = await this.core.state(proposal.id);
    expect(proposalState).to.be.equal(state);
  }

  public async propose(proposer: Wallet, proposal: Proposal): Promise<Proposal> {
    const createdProposal = { ...proposal } as Proposal;
    const proposeTx = await this.core
      .connect(proposer)
      .propose(proposal.targets, proposal.values, proposal.callDatas, proposal.description);

    const events = (await proposeTx.wait()).events as Array<Event>;
    const result = events[0].args as Result;

    createdProposal.id = result['proposalId'];
    createdProposal.startBlock = result['startBlock'];
    createdProposal.endBlock = result['endBlock'];
    createdProposal.delay = await this.executor.getMinDelay();

    await advanceBlock();

    return createdProposal;
  }

  public async queue(proposal: Proposal): Promise<Proposal> {
    const queuedProposal = { ...proposal } as Proposal;
    const descriptionHash = utils.keccak256(formatBytesString(proposal.description));
    const queueTx = await this.core.queue(
      proposal.targets,
      proposal.values,
      proposal.callDatas,
      descriptionHash
    );

    const events = (await queueTx.wait()).events as Array<Event>;
    const result = events[1].args as Result;

    queuedProposal.eta = result['eta'];

    return queuedProposal;
  }

  public async execute(proposal: Proposal) {
    const descriptionHash = utils.keccak256(formatBytesString(proposal.description));
    return await this.core.execute(
      proposal.targets,
      proposal.values,
      proposal.callDatas,
      descriptionHash
    );
  }

  public static async setup(admin: Wallet) {
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
      utils.parseUnits('10000', 18),
      BigNumber.from(20),
    ])) as Executor;

    const core = (await waffle.deployContract(admin, ElyfiGovernanceCoreTestArtifact, [
      executor.address,
      1,
      10,
    ])) as ElyfiGovernanceCoreTest;

    await executor.init(core.address);

    const rewardPersecond = BigNumber.from(utils.parseEther('1'));
    const year = BigNumber.from(2022);
    const month = BigNumber.from(7);
    const day = BigNumber.from(7);
    const duration = BigNumber.from(30);

    const startTimestamp = toTimestamp(year, month, day, BigNumber.from(10));

    const initTx = await stakedElyfiToken
      .connect(admin)
      .initNewRound(rewardPersecond, year, month, day, duration);

    await advanceTimeTo(await getTimestamp(initTx), startTimestamp);

    return new TestEnv(admin, core, executor, elyfiToken, stakedElyfiToken);
  }
}
