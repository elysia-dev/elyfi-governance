import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Wallet, utils } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';

import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

const { loadFixture } = waffle;

describe('policy', () => {
  let [admin, proposer, alice, bob, carol]: Wallet[] = [];
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
  });

  after(async () => {
    await loadFixture(fixture);
  });

  context('deployed', async () => {
    it('deployment check in Policy', async () => {
      expect(
        await testEnv.executor.hasRole(
          await testEnv.executor.POLICY_ADMIN_ROLE(),
          testEnv.admin.address
        )
      ).to.be.true;
      expect(
        await testEnv.executor.hasRole(
          await testEnv.executor.POLICY_ADMIN_ROLE(),
          testEnv.executor.address
        )
      ).to.be.true;
      expect(await testEnv.executor.token()).to.be.equal(testEnv.stakedElyfiToken.address);
      expect(await testEnv.executor.minVotingPower()).to.be.equal(utils.parseUnits('10000', 18));
      expect(await testEnv.executor.quorumNumerator()).to.be.equal(20);
    });
  });

  context('update', async () => {
    it('revert if normal account update policy env variables', async () => {
      await expect(testEnv.executor.connect(alice).updateQuorumNumerator(40)).to.be.revertedWith(
        'Only Policy Admin'
      );
      await expect(
        testEnv.executor.connect(alice).updateMinVotingPower(utils.parseUnits('20000', 18))
      ).to.be.revertedWith('Only Policy Admin');
    });

    it('revert if new min voting power exceeds totalSuppy of the staked token', async () => {
      await expect(
        testEnv.executor.connect(admin).updateMinVotingPower(utils.parseUnits('100000', 18))
      ).to.be.revertedWith('VotingPower exceeds TotalSupply');
    });

    it('revert if new quorumNumerator is over quorumDenominator', async () => {
      await expect(testEnv.executor.connect(admin).updateQuorumNumerator(200)).to.be.revertedWith(
        'QuorumNumerator over QuorumDenominator'
      );
    });

    it('admin can update quorum numerator and min voting power', async () => {
      await expect(
        testEnv.executor.connect(admin).updateMinVotingPower(utils.parseUnits('20000', 18))
      )
        .to.be.emit(testEnv.executor, 'MinVotingPowerUpdated')
        .withArgs(utils.parseUnits('10000', 18), utils.parseUnits('20000', 18));
      await expect(testEnv.executor.connect(admin).updateQuorumNumerator(40))
        .to.be.emit(testEnv.executor, 'QuorumNumeratorUpdated')
        .withArgs(20, 40);
    });
  });

  context('vote success', async () => {
    let proposal: Proposal;
    beforeEach('set', async () => {
      const targets = [testEnv.executor.address];
      const values = [BigNumber.from(0)];
      const calldatas = [
        testEnv.executor.interface.encodeFunctionData('grantRole', [
          await testEnv.executor.LENDING_COMPANY_ROLE(),
          carol.address,
        ]),
      ];
      proposal = Proposal.createProposal(targets, values, calldatas, 'description');
      proposal = await testEnv.propose(proposer, proposal);
    });
    it('"voteSucceeded" should be false when for and against are the same', async () => {
      await testEnv.core.connect(alice).castVote(proposal.id, VoteType.for);
      await testEnv.core.connect(bob).castVote(proposal.id, VoteType.against);
      const proposalVote = await testEnv.core.proposalVotes(proposal.id);
      expect(await testEnv.executor.voteSucceeded(proposalVote)).to.be.false;
    });

    it('revert if new min voting power exceeds totalSuppy of the staked token', async () => {
      await expect(
        testEnv.executor.connect(admin).updateMinVotingPower(utils.parseUnits('100000', 18))
      ).to.be.revertedWith('VotingPower exceeds TotalSupply');
    });

    it('revert if new quorumNumerator is over quorumDenominator', async () => {
      await expect(testEnv.executor.connect(admin).updateQuorumNumerator(200)).to.be.revertedWith(
        'QuorumNumerator over QuorumDenominator'
      );
    });

    it('admin can update quorum numerator and min voting power', async () => {
      await expect(
        testEnv.executor.connect(admin).updateMinVotingPower(utils.parseUnits('20000', 18))
      )
        .to.be.emit(testEnv.executor, 'MinVotingPowerUpdated')
        .withArgs(utils.parseUnits('10000', 18), utils.parseUnits('20000', 18));
      await expect(testEnv.executor.connect(admin).updateQuorumNumerator(40))
        .to.be.emit(testEnv.executor, 'QuorumNumeratorUpdated')
        .withArgs(20, 40);
    });
  });
});
