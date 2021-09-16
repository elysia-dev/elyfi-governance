import { BigNumber } from '@ethersproject/bignumber';
import { utils, Wallet } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';

import { ProposalState, VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';
import { advanceBlockFromTo, advanceTimeToProposalEta } from './utils/time';

const { loadFixture } = waffle;

describe('state', () => {
  let [admin, proposer, alice, bob, carol]: Wallet[] = [];
  let proposal: Proposal;
  let testEnv: TestEnv;
  let chainId: number;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin);
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

    const targets = [testEnv.executor.address];
    const values = [BigNumber.from(0)];
    const calldatas = [
      testEnv.executor.interface.encodeFunctionData('grantRole', [
        await testEnv.executor.LENDING_COMPANY_ROLE(),
        carol.address,
      ]),
    ];
    proposal = await Proposal.createProposal(targets, values, calldatas, 'description');
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
      const tx = await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      await advanceBlockFromTo((await tx.wait()).blockNumber, proposal.endBlock.toNumber());
      await testEnv.expectProposalState(proposal, ProposalState.succeeded);
      await testEnv.queue(proposal);
      await testEnv.expectProposalState(proposal, ProposalState.queued);
    });

    it('defeated', async () => {
      //for:10000
      await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      //against:20000
      await testEnv.core.connect(bob).castVote(proposal.id, VoteType.against);
      const tx = await testEnv.core.connect(carol).castVote(proposal.id, VoteType.against);
      await advanceBlockFromTo((await tx.wait()).blockNumber, proposal.endBlock.toNumber());
      await testEnv.expectProposalState(proposal, ProposalState.defeated);
    });
  });

  context('defeated if not exceeds quorum', async () => {
    beforeEach('propose', async () => {
      await testEnv.elyfiToken
        .connect(admin)
        .approve(testEnv.stakedElyfiToken.address, utils.parseUnits('100000', 18));
      //quorum:100000 * 20% = 20000
      await testEnv.stakedElyfiToken.connect(admin).stake(utils.parseUnits('100000', 18));
      proposal = await testEnv.propose(proposer, proposal);
    });

    it('defeated if not exceeds quorum', async () => {
      //for:10000
      const tx = await testEnv.core.connect(alice).castVote(proposal.id, VoteType.against);
      await advanceBlockFromTo((await tx.wait()).blockNumber, proposal.endBlock.toNumber());
      await testEnv.expectProposalState(proposal, ProposalState.defeated);
    });
  });

  context('state after vote', async () => {
    beforeEach('vote success', async () => {
      proposal = await testEnv.propose(proposer, proposal);
      const tx = await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      await advanceBlockFromTo((await tx.wait()).blockNumber, proposal.endBlock.toNumber());
    });

    it('queued and executed', async () => {
      const queuedproposal = await testEnv.queue(proposal);
      await testEnv.expectProposalState(queuedproposal, ProposalState.queued);
      await advanceTimeToProposalEta(proposal);
      await testEnv.execute(queuedproposal);
      await testEnv.expectProposalState(proposal, ProposalState.executed);
    });
  });
});
