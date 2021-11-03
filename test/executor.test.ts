import { BigNumber } from '@ethersproject/bignumber';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';

import { VoteType } from './utils/enum';
import { Proposal } from './utils/proposal';

const { loadFixture } = waffle;

describe('executor', () => {
  let [admin, proposer, alice, bob, carol]: Wallet[] = [];
  let proposal: Proposal;
  let testEnv: TestEnv;
  let chainId: number;

  async function fixture() {
    const testEnv = await TestEnv.setup(admin);
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

    proposal = Proposal.createProposal(targets, values, calldatas, 'description');
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
  });
});
