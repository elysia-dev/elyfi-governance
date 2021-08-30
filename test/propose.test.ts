import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

const { loadFixture } = waffle;

describe('propose', () => {
  let admin: Wallet;
  let proposer: Wallet;
  let voter: Wallet;
  let testEnv: TestEnv;
  let proposal: Proposal;

  async function fixture() {
    return await TestEnv.setup(admin, false);
  }

  before(async () => {
    [admin, proposer, voter] = waffle.provider.getWallets();
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

  it('reverts if proposer has not been authorized', async () => {
    await expect(
      testEnv.core
        .connect(voter)
        .propose(proposal.targets, proposal.values, proposal.callDatas, proposal.description)
    ).to.be.revertedWith('Invaild Proposer');
  });

  it('success', async () => {
    expect(
      await testEnv.core
        .connect(proposer)
        .propose(proposal.targets, proposal.values, proposal.callDatas, proposal.description)
    ).to.emit(testEnv.core, 'ProposalCreated');
  });

  context('Invalid proposal', async () => {
    const targets = it('reverts if target is not designated', async () => {});
    it('reverts if mismatch in the number of targets and calldatas', async () => {});
  });
});
