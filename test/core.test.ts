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

describe('Set executor', async () => {
  it('success', async () => {});
  it('reverts if execute canceled proposal', async () => {});
  it('reverts if execute expired proposal', async () => {});
  it('reverts if execute queued proposal before timelock', async () => {});
});

describe('Set', async () => {
  it('reverts if cancel canceled proposal', async () => {});
  it('reverts if normal account cancel proposal', async () => {});
});
