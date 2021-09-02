import {
  LToken,
  MoneyPool,
  ERC20Test,
  InterestRateModel,
  Tokenizer,
  Connector,
  DataPipeline,
  DToken,
  IncentivePool,
  Validation__factory,
  Validation,
  AssetBond,
  Index,
  Rate,
  TimeConverter,
  ERC20Test__factory,
  Connector__factory,
  MoneyPool__factory,
  IncentivePool__factory,
  InterestRateModel__factory,
  LToken__factory,
  DToken__factory,
  Tokenizer__factory,
  DataPipeline__factory,
} from '@elysia-dev/contract-typechain';

import { Contract, BigNumber, utils, Wallet } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { toRate } from '../utils/math';

import { ElyfiAssetBond } from '../utils/assetBond';
import { getTimestamp } from '../utils/time';

export class Elyfi {
  admin: Wallet;
  underlyingAsset: ERC20Test;
  incentiveAsset: ERC20Test;
  connector: Connector;
  moneyPool: MoneyPool;
  incentivePool: IncentivePool;
  interestRateModel: InterestRateModel;
  lToken: LToken;
  dToken: DToken;
  tokenizer: Tokenizer;
  dataPipeline: DataPipeline;

  constructor(
    admin: Wallet,
    underlyingAsset: ERC20Test,
    incentiveAsset: ERC20Test,
    connector: Connector,
    moneyPool: MoneyPool,
    incentivePool: IncentivePool,
    interestRateModel: InterestRateModel,
    lToken: LToken,
    dToken: DToken,
    tokenizer: Tokenizer,
    dataPipeline: DataPipeline
  ) {
    this.admin = admin;
    this.underlyingAsset = underlyingAsset;
    this.incentiveAsset = incentiveAsset;
    this.connector = connector;
    this.moneyPool = moneyPool;
    this.incentivePool = incentivePool;
    this.interestRateModel = interestRateModel;
    this.lToken = lToken;
    this.dToken = dToken;
    this.tokenizer = tokenizer;
    this.dataPipeline = dataPipeline;
  }

  public async setLendingCompany(accounts: Wallet[] | Contract[]) {
    for (let account of accounts) {
      await this.connector.connect(this.admin).addCollateralServiceProvider(account.address);
    }
  }

  public async setCouncil(accounts: Wallet[] | Contract[]) {
    for (let account of accounts) {
      await this.connector.connect(this.admin).addCouncil(account.address);
    }
  }

  public async mintAssetBond(minter: Wallet, assetBond: ElyfiAssetBond) {
    await this.tokenizer.connect(minter).mintAssetBond(minter.address, assetBond.tokenId);
  }

  public async settleAssetBond(owner: Wallet, assetBond: ElyfiAssetBond) {
    await this.tokenizer
      .connect(owner)
      .settleAssetBond(
        assetBond.borrower,
        assetBond.signer,
        assetBond.tokenId,
        assetBond.principal,
        assetBond.couponRate,
        assetBond.delinquencyRate,
        assetBond.debtCeiling,
        assetBond.loanDuration,
        assetBond.loanStartTimeYear,
        assetBond.loanStartTimeMonth,
        assetBond.loanStartTimeDay,
        'hash'
      );
  }

  public static async setup(admin: Wallet) {
    const validationFactory = await ethers.getContractFactory('Validation');
    const validation = (await validationFactory.deploy()) as Validation;

    const timeConverterFactory = await ethers.getContractFactory('TimeConverter');
    const timeConverter = (await timeConverterFactory.deploy()) as TimeConverter;

    const assetBondFactory = await ethers.getContractFactory('AssetBond', {
      libraries: {
        TimeConverter: timeConverter.address,
      },
    });
    const assetBond = (await assetBondFactory.deploy()) as AssetBond;

    const rateFactory = await ethers.getContractFactory('Rate');
    const rate = (await rateFactory.deploy()) as Rate;

    const indexFactory = await ethers.getContractFactory('Index');
    const index = (await indexFactory.deploy()) as Index;

    const erc20Factory = (await ethers.getContractFactory('ERC20Test')) as ERC20Test__factory;
    const underlyingAsset = (await erc20Factory.deploy(
      utils.parseUnits('1', 36),
      'name',
      'symbol'
    )) as ERC20Test;
    const incentiveAsset = (await erc20Factory.deploy(
      utils.parseUnits('1', 36),
      'name',
      'symbol'
    )) as ERC20Test;

    const connectorFactory = (await ethers.getContractFactory('Connector')) as Connector__factory;
    const connector = (await connectorFactory.deploy()) as Connector;

    const moneyPoolFactory = (await ethers.getContractFactory('MoneyPool', {
      libraries: {
        AssetBond: assetBond.address,
        Validation: validation.address,
        TimeConverter: timeConverter.address,
        Index: index.address,
        Rate: rate.address,
      },
    })) as MoneyPool__factory;
    const moneyPool = (await moneyPoolFactory.deploy(
      16, //MaxReserveCount
      connector.address
    )) as MoneyPool;

    const incentivePoolFactory = (await ethers.getContractFactory(
      'IncentivePool'
    )) as IncentivePool__factory;
    const incentivePool = (await incentivePoolFactory.deploy(
      moneyPool.address,
      incentiveAsset.address,
      BigNumber.from(0)
    )) as IncentivePool;

    const interestRateModelFactory = (await ethers.getContractFactory(
      'InterestRateModel'
    )) as InterestRateModel__factory;
    const interestRateModel = (await interestRateModelFactory.deploy(
      toRate(0.8),
      toRate(0.02),
      toRate(0.1),
      toRate(1)
    )) as InterestRateModel;

    const lTokenFactory = (await ethers.getContractFactory('LToken')) as LToken__factory;
    const lToken = (await lTokenFactory.deploy(
      moneyPool.address,
      underlyingAsset.address,
      incentivePool.address,
      'LTokenName',
      'LTokenSymbol'
    )) as LToken;

    const dTokenFactory = (await ethers.getContractFactory('DToken')) as DToken__factory;
    const dToken = (await dTokenFactory.deploy(
      moneyPool.address,
      underlyingAsset.address,
      'DTokenName',
      'DTokenSymbol'
    )) as DToken;

    const tokenizerFactory = (await ethers.getContractFactory('Tokenizer', {
      libraries: {
        AssetBond: assetBond.address,
        Validation: validation.address,
        TimeConverter: timeConverter.address,
      },
    })) as Tokenizer__factory;
    const tokenizer = (await tokenizerFactory.deploy(
      connector.address,
      moneyPool.address,
      'TokenizerName',
      'TokenizerSymbol'
    )) as Tokenizer;

    const dataPipelineFactory = (await ethers.getContractFactory(
      'DataPipeline'
    )) as DataPipeline__factory;
    const dataPipeline = await dataPipelineFactory.deploy(moneyPool.address);

    await moneyPool.addNewReserve(
      underlyingAsset.address,
      lToken.address,
      dToken.address,
      interestRateModel.address,
      tokenizer.address,
      incentivePool.address,
      0 //Moneypool factor
    );

    return new Elyfi(
      admin,
      underlyingAsset,
      incentiveAsset,
      connector,
      moneyPool,
      incentivePool,
      interestRateModel,
      lToken,
      dToken,
      tokenizer,
      dataPipeline
    );
  }
}
