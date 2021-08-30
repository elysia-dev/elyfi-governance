import { loadFixture } from '@ethereum-waffle/provider';
import { Wallet } from 'ethers';
import { waffle, ethers } from 'hardhat';
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
});

describe('', async () => {
  it('success', async () => {});
  it('reverts if queue not existing proposal', async () => {});
  it('reverts if queue not succeed proposal', async () => {});
});

describe('cancel', async () => {});
