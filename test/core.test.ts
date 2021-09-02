import { loadFixture } from '@ethereum-waffle/provider';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { waffle } from 'hardhat';
import { TestEnv } from './fixture/testEnv';

describe('core', () => {
  let admin: Wallet;
  let proposer: Wallet;
  let voter: Wallet;
  let testEnv: TestEnv;

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
  });

  context('Deploy', async () => {
    it('deployment check', async () => {
      expect(await testEnv.core.name()).to.be.equal('ElyfiGovernanceCore');
      expect(await testEnv.core.timelock()).to.be.equal(testEnv.executor.address);
      expect(await testEnv.core.votingDelay()).to.be.equal(1); // In the mock core contract
      expect(await testEnv.core.votingPeriod()).to.be.equal(10); // In the mock core contract
      expect(await testEnv.core.quorum(0)).to.be.equal(0);
    });
  });
});
