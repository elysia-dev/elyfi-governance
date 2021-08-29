import { loadFixture } from '@ethereum-waffle/provider';
import { BigNumber } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

describe('core', () => {
  let admin: SignerWithAddress;
  let proposer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let testEnv: TestEnv;
  let proposal: Proposal;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin, false);
    await testEnv.setProposers([proposer]);
    await testEnv.setVoters([alice, bob, carol]);
    return testEnv;
  }

  before(async () => {
    const signers = await ethers.getSigners();
    admin = signers[0];
    proposer = signers[1];
    alice = signers[2];
    bob = signers[3];
    carol = signers[4];
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

  it('reverts if cast vote on not existing proposal', async () => {
    await expect(testEnv.core.castVote(BigNumber.from(1234), VoteType.for)).to.be.revertedWith(
      'Governor: unknown proposal id'
    );
  });
  context('proposal created', async () => {
    beforeEach('', async () => {
      proposal = await testEnv.propose(proposer, proposal);
    });
    it('votes and success', async () => {
      expect(testEnv.core.connect(alice).castVote(proposal.id, VoteType.for)).to.be.emit(
        testEnv.core,
        'VoteCast'
      );
    });
  });

  describe('', async () => {
    it('votes via delegation and success', async () => {});
    it('vote fails if not exceeds quorum', async () => {});
    it('vote fails if against exceeds for', async () => {});
    it('reverts if vote twice', async () => {});
    it('reverts if vote via delegation but invaild signature', async () => {});
    it('reverts if cast vote on closed proposal', async () => {});
  });
});
