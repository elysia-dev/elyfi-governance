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

import MoneyPoolArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/MoneyPool.sol/MoneyPool.json';
import ConnectorArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/Connector.sol/Connector.json';
import TokenizerArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/Tokenizer.sol/Tokenizer.json';
import LTokenArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/LToken.sol/LToken.json';
import DTokenArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/DToken.sol/DToken.json';
import DataPipelineArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/DataPipeline.sol/DataPipeline.json';
import IncentivePoolArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/IncentivePool.sol/IncentivePool.json';
import InterestRateModelArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/InterestRateModel.sol/InterestRateModel.json';
import ERC20Artifact from '@elysia-dev/contract-artifacts/artifacts/contracts/test/ERC20Test.sol/ERC20Test.json';

import AssetBondArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/logic/AssetBond.sol/AssetBond.json';
import RateArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/logic/AssetBond.sol/AssetBond.json';
import IndexArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/logic/Index.sol/Index.json';

import TimeConverterArtifact from '@elysia-dev/contract-artifacts/artifacts/contracts/libraries/TimeConverter.sol/TimeConverter.json';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract, BigNumber, utils } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { toRate } from '../utils/math';
// import { testIncentiveAmountPerSecond, testInterestModelParams, testReserveData } from './testData';

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

    const timeConverter = (await waffle.deployContract(
      admin,
      TimeConverterArtifact
    )) as TimeConverter;

    const assetBond = (await waffle.deployContract(admin, AssetBondArtifact)) as AssetBond;

    const rate = (await waffle.deployContract(admin, RateArtifact)) as Rate;

    const index = (await waffle.deployContract(admin, IndexArtifact)) as Index;

    const underlyingAsset = (await waffle.deployContract(admin, ERC20Artifact, [
      utils.parseUnits('1', 36),
      'name',
      'symbol',
    ])) as ERC20Test;

    const incentiveAsset = (await waffle.deployContract(admin, ERC20Artifact, [
      utils.parseUnits('1', 36),
      'name',
      'symbol',
    ])) as ERC20Test;

    const connector = (await waffle.deployContract(admin, ConnectorArtifact)) as Connector;

    const moneyPool = (await waffle.deployContract(admin, MoneyPoolArtifact, [
      16, //MaxReserveCount
      connector.address,
    ])) as MoneyPool;

    const incentivePool = (await waffle.deployContract(admin, IncentivePoolArtifact, [
      moneyPool.address,
      incentiveAsset.address,
      BigNumber.from(0),
    ])) as IncentivePool;

    const interestRateModel = (await waffle.deployContract(admin, InterestRateModelArtifact, [
      toRate(0.8),
      toRate(0.02),
      toRate(0.1),
      toRate(1),
    ])) as InterestRateModel;

    const lToken = (await waffle.deployContract(admin, LTokenArtifact, [
      moneyPool.address,
      underlyingAsset.address,
      'LTokenName',
      'LTokenSymbol',
    ])) as LToken;

    const dToken = (await waffle.deployContract(admin, DTokenArtifact, [
      moneyPool.address,
      underlyingAsset.address,
      'DTokenName',
      'DTokenSymbol',
    ])) as DToken;

    const tokenizer = (await waffle.deployContract(admin, TokenizerArtifact, [
      connector.address,
      moneyPool.address,
      'TokenizerName',
      'TokenizerSymbol',
    ])) as Tokenizer;

    const dataPipeline = (await waffle.deployContract(admin, DataPipelineArtifact, [
      moneyPool.address,
    ])) as DataPipeline;

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
