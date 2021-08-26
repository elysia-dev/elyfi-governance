import { Tokenizer } from '@elysia-dev/contract-typechain';
import { BigNumber } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

const { loadFixture } = waffle;

describe('propose', () => {
  let admin: SignerWithAddress;
  let proposer: SignerWithAddress;
  let voter: SignerWithAddress;
  let testEnv: TestEnv;
  let proposal: Proposal;

  async function fixture() {
    return await TestEnv.setup(admin, proposer, false);
  }

  before(async () => {
    const signers = await ethers.getSigners();
    admin = signers[0];
    proposer = signers[1];
    voter = signers[2];
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
