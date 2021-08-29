import { loadFixture } from '@ethereum-waffle/provider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { waffle, ethers } from 'hardhat';
import { TestEnv } from './fixture/testEnv';

describe('core', () => {
  let admin: SignerWithAddress;
  let proposer: SignerWithAddress;
  let voter: SignerWithAddress;
  let testEnv: TestEnv;

  async function fixture() {
    return await TestEnv.setup(admin, false);
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
  it('reverts if queue not existing proposal', async () => {});
  it('reverts if queue not succeed proposal', async () => {});
});

describe('cancel', async () => {});
