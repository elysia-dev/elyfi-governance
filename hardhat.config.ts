import 'dotenv/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

import { HardhatUserConfig } from 'hardhat/types';

import './tasks/test/elyfi';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
      optimizer: {
        enabled: true,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    hardhat: {
      mining: {},
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.ADMIN || ''],
      chainId: 1,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: {
        mnemonic: process.env.TEST_MNEMONIC,
      },
      chainId: 3,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: {
        mnemonic: process.env.TEST_MNEMONIC,
      },
      chainId: 42,
    },
    ganache: {
      url: 'http://0.0.0.0:8545',
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
  },
  external: {
    contracts: [
      {
        artifacts: 'node_modules/@elysia-dev/contract-artifacts/artifacts',
      },
    ],
    deployments: {
      kovan: ['dependencies/kovan'],
    },
  },
};

export default config;
