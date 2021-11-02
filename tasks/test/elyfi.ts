import { task } from 'hardhat/config';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector, ERC20Test, StakingPool, Tokenizer } from '@elysia-dev/contract-typechain';
import { getContract } from '../../utils/deployment';
import { Executor } from '../../typechain';
import { BigNumber, utils } from 'ethers';
import { toRate } from '../../test/utils/math';

interface Args {
  nonce: string;
}

const assetBond = {
  tokenId: BigNumber.from(
    '115792089237316195422007842550160057480242544124026915590235438085798243682305'
  ),
  borrower: '',
  signer: '',
  principal: utils.parseEther('500000'),
  debtCeiling: utils.parseEther('2500000000'),
  couponRate: toRate(0.1),
  delinquencyRate: toRate(0.03),
  loanDuration: BigNumber.from(365),
  loanStartTimeYear: BigNumber.from(2021),
  loanStartTimeMonth: BigNumber.from(11),
  loanStartTimeDay: BigNumber.from(2),
  ipfsHash: '',
};

const checkCollateralServiceProvider = async ({
  connector,
  txSender,
  deployer,
}: {
  connector: Connector;
  txSender: string;
  deployer: SignerWithAddress;
}) => {
  const isCollateralServiceProvider = await connector.isCollateralServiceProvider(txSender);
  if (!isCollateralServiceProvider) {
    const addCollateralServiceProviderTx = await connector
      .connect(deployer)
      .addCollateralServiceProvider(txSender);
    await addCollateralServiceProviderTx.wait();
    console.log(`Deployer add a collateral service provider role to ${txSender}`);
  }
};

const checkCouncil = async ({
  connector,
  txSender,
  deployer,
}: {
  connector: Connector;
  txSender: string;
  deployer: SignerWithAddress;
}) => {
  const isCouncil = await connector.isCouncil(txSender);
  if (!isCouncil) {
    const addCouncilTx = await connector.connect(deployer).addCouncil(txSender);
    await addCouncilTx.wait();
    console.log(`Deployer add a council role to ${txSender}`);
  }
};

task('elyfi:mintAssetBond', 'mint asset bond')
  .addParam('nonce', 'The asset bond from saved data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const tokenizer = (await getContract(hre, 'Elyfi_USDT_Tokenzier')) as Tokenizer;
    const connector = (await getContract(hre, 'Connector')) as Connector;
    const executor = (await getContract(hre, 'Executor')) as Executor;

    const tokenId = assetBond.tokenId.sub(args.nonce);

    await checkCollateralServiceProvider({
      connector: connector,
      txSender: lendingCompany.address,
      deployer: deployer,
    });
    await checkCouncil({ connector: connector, txSender: executor.address, deployer: deployer });

    const mintTx = await tokenizer
      .connect(lendingCompany)
      .mintAssetBond(lendingCompany.address, tokenId);
    await mintTx.wait();
    console.log(`The lending company mints asset token`);
  });

task('elyfi:settleAssetBond', 'settle asset bond')
  .addParam('nonce', 'The asset bond from saved data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const tokenizer = (await getContract(hre, 'Elyfi_USDT_Tokenzier')) as Tokenizer;
    const connector = (await getContract(hre, 'Connector')) as Connector;
    const executor = (await getContract(hre, 'Executor')) as Executor;

    const tokenId = assetBond.tokenId.sub(args.nonce);

    await checkCollateralServiceProvider({
      connector: connector,
      txSender: lendingCompany.address,
      deployer: deployer,
    });
    await checkCouncil({ connector: connector, txSender: executor.address, deployer: deployer });

    const settleTx = await tokenizer
      .connect(lendingCompany)
      .settleAssetBond(
        borrower.address,
        executor.address,
        tokenId,
        assetBond.principal,
        assetBond.couponRate,
        assetBond.delinquencyRate,
        assetBond.debtCeiling,
        assetBond.loanDuration,
        assetBond.loanStartTimeYear,
        assetBond.loanStartTimeMonth,
        assetBond.loanStartTimeDay,
        assetBond.ipfsHash
      );
    await settleTx.wait();
    console.log(
      `The lending company settled asset bond, loan start day is ${assetBond.loanStartTimeMonth}/${assetBond.loanStartTimeDay}`
    );
  });

task('elyfi:stakeElyfi', 'stake elyfi').setAction(
  async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const elyfi = await getContract(hre, 'Elyfi');
    const stakingPool = await getContract(hre, 'StakingPoolV2');

    const accounts = [deployer, lendingCompany, borrower];

    for (let account of accounts) {
      const faucetTx = await elyfi.connect(account).faucet();
      await faucetTx.wait();
      const balance = await elyfi.balanceOf(account.address);
      const approveTx = await elyfi.connect(account).approve(stakingPool.address, balance);
      await approveTx.wait();
      const stakeTx = await stakingPool.connect(account).stake(balance);
      await stakeTx.wait();
    }
  }
);

task('elyfi:delegate', 'delegate elyfi').setAction(
  async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const stakingPool = await getContract(hre, 'StakingPoolV2');

    const accounts = [deployer, lendingCompany, borrower];

    for (let account of accounts) {
      const delegateTx = await stakingPool.connect(account).delegate(account.address);
      await delegateTx.wait();
    }
  }
);
