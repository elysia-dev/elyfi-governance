import { task } from 'hardhat/config';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector, MoneyPool, Tokenizer } from '@elysia-dev/contract-typechain';
import { getContract } from '../../utils/getElyfi';
import { ElyfiAssetBond } from '../../test/utils/assetBond';
import { Executor } from '../../typechain';

interface Args {
  nonce: string;
}

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
    let assetBond: ElyfiAssetBond;

    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const tokenizer = (await getContract(hre, 'Tokenizer')) as Tokenizer;
    const connector = (await getContract(hre, 'Connector')) as Connector;
    const executor = (await getContract(hre, 'Executor')) as Executor;

    assetBond = await ElyfiAssetBond.assetBondExample(executor.address, borrower.address);

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

task('elyfi:settleAssetBond', 'mint asset bond')
  .addParam('nonce', 'The asset bond from saved data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let assetBond: ElyfiAssetBond;

    const [deployer, lendingCompany, borrower] = await hre.ethers.getSigners();

    const tokenizer = (await getContract(hre, 'Tokenizer')) as Tokenizer;
    const connector = (await getContract(hre, 'Connector')) as Connector;
    const executor = (await getContract(hre, 'Executor')) as Executor;

    assetBond = await ElyfiAssetBond.assetBondExample(executor.address, borrower.address);
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
      `The collateral service provider settled asset bond, loan start day is 
      ${assetBond.loanStartTimeMonth}/${assetBond.loanStartTimeDay}`
    );
  });
