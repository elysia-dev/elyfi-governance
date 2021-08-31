import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Contract, Wallet } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

import { buildDelegationData, getSignatureFromTypedData } from './utils/signature';
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

  async function fixture() {
    const testEnv = await TestEnv.setup(admin, false);
    await testEnv.setProposers([proposer]);
    await testEnv.setStakers([alice, bob, carol]);
    return testEnv;
  }

  before(async () => {
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

  context('revert', async () => {
    it('reverts if cast vote on non existing proposal', async () => {
      await expect(testEnv.core.castVote(BigNumber.from(1234), VoteType.for)).to.be.revertedWith(
        'Governor: unknown proposal id'
      );
    });
  });

  context('proposal created', async () => {
    beforeEach('propose', async () => {
      testEnv = await loadFixture(fixture);
      proposal = await testEnv.propose(proposer, proposal);
    });

    it('reverts if voting power is below the minumum', async () => {
      await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      await expect(
        testEnv.core.connect(alice).castVote(proposal.id, VoteType.for)
      ).to.be.revertedWith('ElyfiGovernor: Vote already casted');
    });

    context('self delegation', async () => {
      beforeEach('', async () => {
        await testEnv.stakedElyfiToken.connect(alice).delegate(alice.address);
        await testEnv.stakedElyfiToken.connect(bob).delegate(bob.address);
      });

      it('success', async () => {});
    });

    context('delegation via signature', async () => {
      beforeEach('propose', async () => {
        testEnv = await loadFixture(fixture);
        proposal = await testEnv.propose(proposer, proposal);
      });

      it('success', async () => {});
    });

    it('votes and success', async () => {
      const votingWeight = await testEnv.stakedElyfiToken.getPastVotes(
        alice.address,
        proposal.startBlock
      );
      await expect(testEnv.core.connect(alice).castVote(proposal.id, VoteType.for))
        .to.be.emit(testEnv.core, 'VoteCast')
        .withArgs(alice.address, proposal.id, VoteType.for, votingWeight, '');
    });

    it('reverts if vote twice', async () => {
      await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      await expect(
        testEnv.core.connect(alice).castVote(proposal.id, VoteType.for)
      ).to.be.revertedWith('ElyfiGovernor: Vote already casted');
    });

    it('votes via delegation and success', async () => {});
    it('vote fails if not exceeds quorum', async () => {});
    it('vote fails if against exceeds for', async () => {});

    it('reverts if vote via delegation but invaild signature', async () => {});
    it('reverts if cast vote on the closed proposal', async () => {});
  });

  context('delegation', async () => {
    beforeEach('delegated', async () => {
      testEnv = await loadFixture(fixture);

      const alicePower = await testEnv.stakedElyfiToken.getVotes(alice.address);
      const bobPower = await testEnv.stakedElyfiToken.getVotes(bob.address);

      const chainId = (await waffle.provider.getNetwork()).chainId;
      const nonce = '0';
      const data = buildDelegationData(
        chainId,
        testEnv.stakedElyfiToken.address,
        alice.address,
        nonce,
        MAX_UINT_AMOUNT
      );

      const signature = getSignatureFromTypedData(alice.privateKey, data);

      const tx = await testEnv.stakedElyfiToken
        .connect(bob)
        .delegateBySig(
          alice.address,
          nonce,
          MAX_UINT_AMOUNT,
          signature.v,
          signature.r,
          signature.s
        );

      // await testEnv.stakedElyfiToken.connect(bob).delegate(alice.address);
    });

    it.only('votes via delegation and success', async () => {
      proposal = await testEnv.propose(proposer, proposal);
      const alicePower = await testEnv.stakedElyfiToken.getVotes(alice.address);
      const bobPower = await testEnv.stakedElyfiToken.getVotes(bob.address);
      // const alicePower = await testEnv.stakedElyfiToken.getPastVotes(
      //   alice.address,
      //   proposal.startBlock
      // );
      // const bobPower = await testEnv.stakedElyfiToken.getPastVotes(
      //   bob.address,
      //   proposal.startBlock
      // );
      // console.log('power after dele', alicePower.toString(), bobPower.toString());
    });
  });
});
