import { Wallet } from 'ethers';
import { waffle } from 'hardhat';

import { TestEnv } from './fixture/testEnv';

const { loadFixture } = waffle;

describe('execute', () => {
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
  it('reverts if execute canceled proposal', async () => {});
  it('reverts if execute expired proposal', async () => {});
  it('reverts if execute queued proposal before timelock', async () => {});
});

describe('cancel', async () => {
  it('reverts if cancel canceled proposal', async () => {});
  it('reverts if normal account cancel proposal', async () => {});
});
