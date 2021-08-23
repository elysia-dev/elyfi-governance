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
  it('reverts if proposer has not been authorized', async () => {});
});

describe('Invalid proposal', async () => {
  it('reverts if target is not designated', async () => {});
  it('reverts if mismatch in targets and calldata', async () => {});
  it('reverts if mismatch in targets and data', async () => {});
});
