import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Contract, Wallet } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { ProposalState, VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

import { buildBallotData, buildDelegationData, getSignatureFromTypedData } from './utils/signature';
import { MAX_UINT_AMOUNT } from './utils/math';
import { advanceBlockToProposalEnd } from './utils/time';

const { loadFixture } = waffle;

describe('state', () => {
  let admin: Wallet;
  let proposer: Wallet;
  let alice: Wallet;
  let bob: Wallet;
  let carol: Wallet;
  let proposal: Proposal;
  let testEnv: TestEnv;
  let chainId: number;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin, false);
    await testEnv.setProposers([proposer]);
    await testEnv.setVoters([alice, bob, carol]);
    return testEnv;
  }

  before(async () => {
    chainId = (await waffle.provider.getNetwork()).chainId;
    [admin, proposer, alice, bob, carol] = waffle.provider.getWallets();
  });

  beforeEach(async () => {
    testEnv = await loadFixture(fixture);

    const proposalId = BigNumber.from('1234');
    const targets = [testEnv.core.address];
    const values = [BigNumber.from(0)];
    const calldatas = [
      testEnv.core.interface.encodeFunctionData('castVote', [proposalId, VoteType.for]),
    ];

    proposal = await Proposal.createProposal(targets, values, calldatas, 'description for apple');
  });

  after(async () => {
    await loadFixture(fixture);
  });

  context('proposal state', async () => {
    beforeEach('propose', async () => {
      proposal = await testEnv.propose(proposer, proposal);
    });

    it('active', async () => {
      await testEnv.expectProposalState(proposal, ProposalState.active);
    });

    it('succeeded & queued', async () => {
      await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      await advanceBlockToProposalEnd(proposal);
      await testEnv.expectProposalState(proposal, ProposalState.succeeded);
      await testEnv.queue(proposal);
      await testEnv.expectProposalState(proposal, ProposalState.queued);
    });

    it('defeated', async () => {
      //for
      await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      //against
      await testEnv.core.connect(bob).castVote(proposal.id, VoteType.against);
      await testEnv.core.connect(carol).castVote(proposal.id, VoteType.against);
      await advanceBlockToProposalEnd(proposal);
      await testEnv.expectProposalState(proposal, ProposalState.defeated);
    });
    it('vote fails if not exceeds quorum', async () => {});
  });

  it('vote fails if not exceeds quorum', async () => {});
  it('vote fails if against exceeds for', async () => {});
});
