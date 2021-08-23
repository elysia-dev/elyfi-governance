import { ElyfiGovernanceCore, Executor } from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { StakingPool, Connector, Tokenizer } from '@elysia-dev/contract-typechain';
import { Elyfi } from './elyfi';
import { waffle } from 'hardhat';

export class TestEnv {
  admin: SignerWithAddress;
  core: ElyfiGovernanceCore;
  executor: Executor;
  elyfi: Elyfi;

  constructor(
    admin: SignerWithAddress,
    core: ElyfiGovernanceCore,
    executor: Executor,
    elyfi: Elyfi
  ) {
    this.admin = admin;
    this.core = core;
    this.executor = executor;
    this.elyfi = elyfi;
  }

  public static async setup(admin: SignerWithAddress) {
    const core = (await waffle.deployContract()) as ElyfiGovernanceCore;
    const executor = (await waffle.deployContract()) as Executor;
    const elyfi = await Elyfi.setup(admin);
    return new TestEnv(admin, core, executor, elyfi);
  }
}
