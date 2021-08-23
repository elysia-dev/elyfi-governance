import { loadFixture } from '@ethereum-waffle/provider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/fixture';

describe('core', () => {
  let admin: SignerWithAddress;
  let testEnv: TestEnv;

  async function fixture() {
    return await TestEnv.setup(admin);
  }

  before(async () => {
    const signers = await ethers.getSigners();
    admin = signers[0];
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
