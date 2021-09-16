import { expect } from 'chai';
import { Wallet } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';

const { loadFixture } = waffle;

describe('core', () => {
  let [admin, proposer, voter]: Wallet[] = [];
  let testEnv: TestEnv;

  async function fixture() {
    return await TestEnv.setup(admin);
  }

  before(async () => {
    [admin, proposer, voter] = waffle.provider.getWallets();
  });

  after(async () => {
    await loadFixture(fixture);
  });

  beforeEach(async () => {
    testEnv = await loadFixture(fixture);
  });

  context('Deploy', async () => {
    it('deployment check', async () => {
      expect(await testEnv.core.name()).to.be.equal('ElyfiGovernanceCore');
      expect(await testEnv.core.timelock()).to.be.equal(testEnv.executor.address);
      expect(await testEnv.core.votingDelay()).to.be.equal(1); // In the mock core contract
      expect(await testEnv.core.votingPeriod()).to.be.equal(10); // In the mock core contract
      expect(await testEnv.core.quorum(0)).to.be.equal(0);
      expect(await testEnv.core.COUNTING_MODE()).to.be.equal('support=bravo&quorum=for,abstain');
    });
  });
});
