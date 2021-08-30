import { loadFixture } from '@ethereum-waffle/provider';
import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';
import { advanceBlock } from './utils/time';

describe('core', () => {
  let admin: Wallet;
  let proposer: Wallet;
  let alice: Wallet;
  let bob: Wallet;
  let carol: Wallet;
  let testEnv: TestEnv;
  let proposal: Proposal;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin, false);
    await testEnv.setProposers([proposer]);
    await testEnv.setVoters([alice, bob, carol]);
    return testEnv;
  }

  before(async () => {
    [admin, proposer, alice, bob, carol] = waffle.provider.getWallets();
  });

  after(async () => {
    await loadFixture(fixture);
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

  it('reverts if cast vote on non existing proposal', async () => {
    await expect(testEnv.core.castVote(BigNumber.from(1234), VoteType.for)).to.be.revertedWith(
      'Governor: unknown proposal id'
    );
  });
  context('proposal created', async () => {
    beforeEach('', async () => {
      proposal = await testEnv.propose(proposer, proposal);
      await advanceBlock();
      await advanceBlock();
    });
    it('votes and success', async () => {
      const weight = await testEnv.stakedElyfiToken.getPastVotes(
        alice.address,
        proposal.startBlock
      );
      expect(testEnv.core.connect(alice).castVote(proposal.id, VoteType.for))
        .to.be.emit(testEnv.core, 'VoteCast')
        .withArgs(alice.address, proposal.id, VoteType.for, weight, '');
    });
    it('votes via delegation and success', async () => {});
  });

  describe('', async () => {
    it('votes via delegation and success', async () => {});
    it('vote fails if not exceeds quorum', async () => {});
    it('vote fails if against exceeds for', async () => {});
    it('reverts if vote twice', async () => {});
    it('reverts if vote via delegation but invaild signature', async () => {});
    it('reverts if cast vote on the closed proposal', async () => {});
  });
});
