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
} from '@elysia-dev/contract-typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract, BigNumber, utils } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { testIncentiveAmountPerSecond, testInterestModelParams, testReserveData } from './testData';

export class Elyfi {
  admin: SignerWithAddress;
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
    admin: SignerWithAddress,
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

  public static async setup(admin: SignerWithAddress) {
    let validation: Validation;
    const validationFactory = (await ethers.getContractFactory(
      'Validation'
    )) as Validation__factory;
    validation = await validationFactory.deploy();

    const timeConverter = (await waffle.deployContract()) as TimeConverter;

    const assetBond = (await waffle.deployContract()) as AssetBond;

    const rate = (await waffle.deployContract()) as Rate;

    const index = (await waffle.deployContract()) as Index;

    const underlyingAsset = (await waffle.deployContract()) as ERC20Test;

    const incentiveAsset = (await waffle.deployContract()) as ERC20Test;

    const connector = (await waffle.deployContract()) as Connector;

    const moneyPool = (await waffle.deployContract()) as MoneyPool;

    const incentivePool = (await waffle.deployContract()) as IncentivePool;

    const interestRateModel = (await waffle.deployContract()) as InterestRateModel;

    const lToken = (await waffle.deployContract()) as LToken;

    const dToken = (await waffle.deployContract()) as DToken;

    const tokenizer = (await waffle.deployContract()) as Tokenizer;

    const dataPipeline = (await waffle.deployContract()) as DataPipeline;

    await moneyPool.addNewReserve(
      underlyingAsset.address,
      lToken.address,
      dToken.address,
      interestRateModel.address,
      tokenizer.address,
      incentivePool.address,
      testReserveData.moneyPoolFactor
    );

    return new ElyfiEnv(
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
