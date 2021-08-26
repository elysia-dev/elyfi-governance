import { Tokenizer } from '@elysia-dev/contract-typechain';
import { loadFixture } from '@ethereum-waffle/provider';
import { BigNumber } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

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
    [admin, proposer, voter] = await ethers.getSigners();
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

  beforeEach(async () => {
    testEnv = await loadFixture(fixture);
  });
});

describe('', async () => {
  it('success', async () => {});
  it('reverts if proposer has not been authorized', async () => {});
});

describe('Invalid proposal', async () => {
  it('reverts if target is not designated', async () => {});
  it('reverts if mismatch in targets and calldata', async () => {});
  it('reverts if mismatch in targets and data', async () => {});
});
