import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Contract, Wallet } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { ProposalState, VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

import { buildBallotData, buildDelegationData, getSignatureFromTypedData } from './utils/signature';
import { MAX_UINT_AMOUNT } from './utils/math';
import { Elyfi } from './fixture/elyfi';
import { AssetBond } from '@elysia-dev/contract-typechain';
import { ElyfiAssetBond } from './utils/assetBond';
import { advanceBlockToProposalEnd } from './utils/time';

const { loadFixture } = waffle;

describe('scenario', () => {
  let admin: Wallet;
  let proposer: Wallet;
  let voter: Wallet;
  let borrower: Wallet;
  let lendingCompany: Wallet;
  let testEnv: TestEnv;
  let elyfi: Elyfi;
  let chainId: number;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin, true);
    await testEnv.setProposers([proposer]);
    await testEnv.setVoters([voter]);
    return testEnv;
  }

  before(async () => {
    chainId = (await waffle.provider.getNetwork()).chainId;
    [admin, proposer, lendingCompany, voter, borrower] = waffle.provider.getWallets();
  });

  beforeEach(async () => {
    testEnv = await loadFixture(fixture);
    elyfi = testEnv.elyfi as Elyfi;
  });

  after(async () => {
    await loadFixture(fixture);
  });

  context('Elyfi:Tokenizer', async () => {
    let assetBond: ElyfiAssetBond;
    let proposal: Proposal;
    beforeEach('set', async () => {
      await elyfi.setLendingCompany([lendingCompany]);
      await elyfi.setCouncil([testEnv.executor]);
      assetBond = await ElyfiAssetBond.assetBondExample(testEnv.executor.address, borrower.address);
      await elyfi.mintAssetBond(lendingCompany, assetBond);
      await elyfi.settleAssetBond(lendingCompany, assetBond);

      const targets = [elyfi.tokenizer.address];
      const values = [BigNumber.from(0)];
      const calldatas = [
        elyfi.tokenizer.interface.encodeFunctionData('signAssetBond', [assetBond.tokenId, 'hash']),
      ];
      proposal = await Proposal.createProposal(targets, values, calldatas, 'description');
    });
    it('signAssetBond, propose:vote:queue:excute, success', async () => {
      proposal = await testEnv.propose(proposer, proposal);
      await testEnv.expectProposalState(proposal, ProposalState.active);
      await testEnv.core.connect(voter).castVote(proposal.id, VoteType.for);
      await advanceBlockToProposalEnd(proposal);
      await testEnv.expectProposalState(proposal, ProposalState.succeeded);
      await testEnv.queue(proposal);
      await testEnv.expectProposalState(proposal, ProposalState.queued);
    });
  });
  context('Elyfi:GovernanceCore', async () => {
    it('grantRole, propose:vote:queue:excute, success');
  });
  context('Elyfi:TimelockController', async () => {
    it('updateDelay, propose:vote:queue:excute, success');
  });
  context('Elyfi:MoneyPool', async () => {
    it('addNewReserve, propose:vote:queue:excute, revert with no authority in executor');
  });
});
