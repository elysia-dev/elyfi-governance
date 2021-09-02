import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Contract, Wallet, utils } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';
import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

import { buildBallotData, buildDelegationData, getSignatureFromTypedData } from './utils/signature';
import { MAX_UINT_AMOUNT } from './utils/math';

const { loadFixture } = waffle;

describe('executor', () => {
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

  context('deployed', async () => {
    it('deployment check in TimelockController', async () => {
      expect(
        await testEnv.executor.hasRole(
          await testEnv.executor.TIMELOCK_ADMIN_ROLE(),
          testEnv.admin.address
        )
      ).to.be.true;
      expect(
        await testEnv.executor.hasRole(
          await testEnv.executor.TIMELOCK_ADMIN_ROLE(),
          testEnv.executor.address
        )
      ).to.be.true;
      expect(await testEnv.executor.getMinDelay()).to.be.equal(6400);
    });
    it('deployment check in TimelockController', async () => {
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

      expect(await testEnv.core.timelock()).to.be.equal(testEnv.executor.address);
      expect(await testEnv.core.votingDelay()).to.be.equal(1); // In the mock core contract
      expect(await testEnv.core.votingPeriod()).to.be.equal(10); // In the mock core contract
      expect(await testEnv.core.quorum(0)).to.be.equal(0);
    });
  });
});
