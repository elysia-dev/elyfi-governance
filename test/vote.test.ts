import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Contract, Wallet } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

import { buildBallotData, buildDelegationData, getSignatureFromTypedData } from './utils/signature';
import { MAX_UINT_AMOUNT } from './utils/math';

const { loadFixture } = waffle;

describe('vote', () => {
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
    await testEnv.setStakers([alice, bob]);
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

  context('revert', async () => {
    it('reverts if cast vote on non existing proposal', async () => {
      await expect(testEnv.core.castVote(BigNumber.from(1234), VoteType.for)).to.be.revertedWith(
        'Governor: unknown proposal id'
      );
    });

    context('propose created', async () => {
      beforeEach('propose', async () => {
        await testEnv.stakedElyfiToken.connect(alice).delegate(alice.address);
        proposal = await testEnv.propose(proposer, proposal);
      });

      it('reverts if vote twice', async () => {
        await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
        await expect(
          testEnv.core.connect(alice).castVote(proposal.id, VoteType.for)
        ).to.be.revertedWith('ElyfiGovernor: Vote already casted');
      });

      it('reverts if voting power is below the minimum', async () => {
        await expect(
          testEnv.core.connect(bob).castVote(proposal.id, VoteType.for)
        ).to.be.revertedWith('ElyfiGovernor: Invalid Voter');
      });
    });
  });

  context('vote via signature', async () => {
    let votingPower: BigNumber;

    beforeEach('voting power delegation via signature', async () => {
      const nonce = '0';
      const data = buildDelegationData(
        chainId,
        testEnv.stakedElyfiToken.address,
        alice.address,
        nonce,
        MAX_UINT_AMOUNT
      );

      const signature = getSignatureFromTypedData(alice.privateKey, data);

      await testEnv.stakedElyfiToken.delegateBySig(
        alice.address,
        nonce,
        MAX_UINT_AMOUNT,
        signature.v,
        signature.r,
        signature.s
      );

      votingPower = await testEnv.stakedElyfiToken.getVotes(alice.address);
      proposal = await testEnv.propose(proposer, proposal);
    });

    it('cast vote and success', async () => {
      const tx = await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      await expect(tx)
        .to.emit(testEnv.core, 'VoteCast')
        .withArgs(alice.address, proposal.id, VoteType.for, votingPower, '');
    });

    it('cast vote via signature and success', async () => {
      const data = buildBallotData(chainId, testEnv.core.address, proposal.id, VoteType.for);
      const signature = getSignatureFromTypedData(alice.privateKey, data);

      const tx = await testEnv.core.castVoteBySig(
        proposal.id,
        VoteType.for,
        signature.v,
        signature.r,
        signature.s
      );

      await expect(tx)
        .to.emit(testEnv.core, 'VoteCast')
        .withArgs(alice.address, proposal.id, VoteType.for, votingPower, '');
    });

    it('reverts if vote via delegation but invaild signature', async () => {
      const data = buildBallotData(chainId, testEnv.core.address, proposal.id, VoteType.for);
      const signature = getSignatureFromTypedData(alice.privateKey, data);

      await expect(
        testEnv.core.castVoteBySig(
          proposal.id,
          VoteType.for,
          signature.v - 1,
          signature.r,
          signature.s
        )
      ).to.be.reverted;
    });
  });
});
