import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { utils, Wallet } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';

import { ProposalState, VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';
import { advanceBlockToProposalEnd, getTimestamp } from './utils/time';
import { formatBytesString } from './utils/bytes';

const { loadFixture } = waffle;

describe('execute', () => {
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

    const proposalId = BigNumber.from('1234');
    const targets = [testEnv.core.address];
    const values = [BigNumber.from(0)];
    const calldatas = [
      testEnv.core.interface.encodeFunctionData('castVote', [proposalId, VoteType.for]),
    ];

    proposal = await Proposal.createProposal(targets, values, calldatas, 'description');
  });

  after(async () => {
    await loadFixture(fixture);
  });

  context('queue', async () => {
    it('reverts if queue not existing proposal', async () => {
      await expect(testEnv.core.castVote(BigNumber.from(1234), VoteType.for)).to.be.revertedWith(
        'Governor: unknown proposal id'
      );
    });

    describe('', async () => {
      it('success', async () => { });
      it('reverts if execute canceled proposal', async () => { });
      it('reverts if execute expired proposal', async () => { });
      it('reverts if execute queued proposal before timelock', async () => { });
    });

    describe('cancel', async () => {
      it('reverts if cancel canceled proposal', async () => { });
      it('reverts if normal account cancel proposal', async () => { });
    });

    context('proposal created', async () => {
      beforeEach('propose', async () => {
        proposal = await testEnv.propose(proposer, proposal);
      });
    });
  });
});
