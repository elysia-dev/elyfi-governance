import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';
import { Elyfi } from './fixture/elyfi';

import { AssetBondState, ProposalState, VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';
import { ElyfiAssetBond } from './utils/assetBond';
import { advanceBlockFromTo, advanceTimeToProposalEta } from './utils/time';

const { loadFixture } = waffle;

describe('scenario', () => {
  let [admin, proposer]: Wallet[] = [];
  let voter: Wallet;
  let borrower: Wallet;
  let lendingCompany: Wallet;
  let testEnv: TestEnv;
  let elyfi: Elyfi;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin);
    await testEnv.setProposers([proposer]);
    await testEnv.setVoters([voter]);
    const elyfi = await Elyfi.setup(admin);
    return { testEnv, elyfi };
  }

  before(async () => {
    [admin, proposer, lendingCompany, voter, borrower] = waffle.provider.getWallets();
  });

  beforeEach(async () => {
    const env = await loadFixture(fixture);
    elyfi = env.elyfi as Elyfi;
    testEnv = env.testEnv as TestEnv;
  });

  after(async () => {
    await loadFixture(fixture);
  });

  context('Elyfi:TimelockController, grantRole, propose:vote:queue:excute', async () => {
    let role: string;
    let proposal: Proposal;

    beforeEach('set', async () => {
      role = await testEnv.executor.LENDING_COMPANY_ROLE();
      const targets = [testEnv.executor.address];
      const values = [BigNumber.from(0)];
      const calldatas = [
        testEnv.executor.interface.encodeFunctionData('grantRole', [role, lendingCompany.address]),
      ];
      proposal = await Proposal.createProposal(targets, values, calldatas, 'description');
    });

    it('success', async () => {
      proposal = await testEnv.propose(proposer, proposal);
      await testEnv.expectProposalState(proposal, ProposalState.active);
      // vote
      const tx = await testEnv.core.connect(voter).castVote(proposal.id, VoteType.for);
      await advanceBlockFromTo((await tx.wait()).blockNumber, proposal.endBlock.toNumber());
      await testEnv.expectProposalState(proposal, ProposalState.succeeded);
      // queue
      const queuedproposal = await testEnv.queue(proposal);
      await testEnv.expectProposalState(queuedproposal, ProposalState.queued);
      await advanceTimeToProposalEta(proposal);
      // execute
      const executeTx = await testEnv.execute(queuedproposal);
      await expect(executeTx)
        .to.emit(testEnv.executor, 'RoleGranted')
        .withArgs(role, lendingCompany.address, testEnv.executor.address);
    });
  });

  context('Elyfi:Tokenizer, signAssetBond, propose:vote:queue:excute, ', async () => {
    let assetBond: ElyfiAssetBond;
    let proposal: Proposal;

    beforeEach('set', async () => {
      await elyfi.setLendingCompany([lendingCompany]);
      await elyfi.setCouncil([testEnv.executor]);
      assetBond = await ElyfiAssetBond.assetBondExample(testEnv.executor.address, borrower.address);
      await elyfi.mintAssetBond(lendingCompany, assetBond);
      await elyfi.settleAssetBond(lendingCompany, assetBond);
      expect((await elyfi.tokenizer.getAssetBondData(assetBond.tokenId)).state).to.be.equal(
        AssetBondState.SETTLED
      );
      // signAssetBond
      const targets = [elyfi.tokenizer.address];
      const values = [BigNumber.from(0)];
      const calldatas = [
        elyfi.tokenizer.interface.encodeFunctionData('signAssetBond', [assetBond.tokenId, 'hash']),
      ];
      proposal = await Proposal.createProposal(targets, values, calldatas, 'description');
    });

    it('success', async () => {
      await testEnv.setVoters([voter]);
      // propose
      proposal = await testEnv.propose(proposer, proposal);
      await testEnv.expectProposalState(proposal, ProposalState.active);
      // vote
      const tx = await testEnv.core.connect(voter).castVote(proposal.id, VoteType.for);
      await advanceBlockFromTo((await tx.wait()).blockNumber, proposal.endBlock.toNumber());
      await testEnv.expectProposalState(proposal, ProposalState.succeeded);
      // queue
      const queuedproposal = await testEnv.queue(proposal);
      await testEnv.expectProposalState(queuedproposal, ProposalState.queued);
      await advanceTimeToProposalEta(proposal);
      // execute
      const executeTx = await testEnv.execute(queuedproposal);
      await expect(executeTx)
        .to.emit(elyfi.tokenizer, 'AssetBondSigned')
        .withArgs(testEnv.executor.address, assetBond.tokenId, 'hash');
      expect((await elyfi.tokenizer.getAssetBondData(assetBond.tokenId)).state).to.be.equal(
        AssetBondState.CONFIRMED
      );
    });
  });

  context('Elyfi:TimelockController, updateDelay, propose:vote:queue:excute', async () => {
    it('success');
  });
});
