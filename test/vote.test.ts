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
  it('votes and success', async () => {});
  it('votes via delegation and success', async () => {});
  it('vote fails if not exceeds quorum', async () => {});
  it('vote fails if against exceeds for', async () => {});
  it('reverts if vote twice', async () => {});
  it('reverts if vote via delegation but invaild signature', async () => {});
  it('reverts if cast vote on closed proposal', async () => {});
  it('reverts if cast vote on not existing proposal', async () => {});
});
