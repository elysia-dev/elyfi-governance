import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Contract, Wallet, utils } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

const { loadFixture } = waffle;

describe('policy', () => {
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
    await testEnv.setStakers([alice, bob, carol]);
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

      expect(await testEnv.core.timelock()).to.be.equal(testEnv.executor.address);
      expect(await testEnv.core.votingDelay()).to.be.equal(1); // In the mock core contract
      expect(await testEnv.core.votingPeriod()).to.be.equal(10); // In the mock core contract
      expect(await testEnv.core.quorum(0)).to.be.equal(0);
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
      ).to.be.revertedWith('VotingPower over TotalSupply');
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
