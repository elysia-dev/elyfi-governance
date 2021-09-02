import { Bytes } from '@ethersproject/bytes';
import { ethers } from 'hardhat';
import { BigNumber, Wallet } from 'ethers';
import { ProposalState } from './enum';
import { toRate } from './math';
import { toTimestamp } from './time';

export class ElyfiAssetBond {
  tokenId: BigNumber;
  borrower: string;
  signer: string;
  principal: BigNumber;
  debtCeiling: BigNumber;
  couponRate: BigNumber;
  delinquencyRate: BigNumber;
  loanDuration: BigNumber;
  loanStartTimeYear: BigNumber;
  loanStartTimeMonth: BigNumber;
  loanStartTimeDay: BigNumber;
  ipfsHash: string;

  constructor(
    tokenId: BigNumber,
    borrower: string,
    signer: string,
    principal: BigNumber,
    debtCeiling: BigNumber,
    couponRate: BigNumber,
    delinquencyRate: BigNumber,
    loanDuration: BigNumber,
    loanStartTimeYear: BigNumber,
    loanStartTimeMonth: BigNumber,
    loanStartTimeDay: BigNumber,
    ipfsHash: string
  ) {
    this.tokenId = tokenId;
    this.borrower = borrower;
    this.signer = signer;
    this.principal = principal;
    this.debtCeiling = debtCeiling;
    this.couponRate = couponRate;
    this.delinquencyRate = delinquencyRate;
    this.loanDuration = loanDuration;
    this.loanStartTimeYear = loanStartTimeYear;
    this.loanStartTimeMonth = loanStartTimeMonth;
    this.loanStartTimeDay = loanStartTimeDay;
    this.ipfsHash = ipfsHash;
  }

  public static async assetBondExample(signer: string, borrower: string) {
    return this.createAssetBond(
      BigNumber.from(
        '115792089237316195422007842550160057480242544124026915590235438085798243682305'
      ),
      signer,
      borrower,
      ethers.utils.parseEther('500000'),
      ethers.utils.parseEther('2500000000'),
      toRate(0.1),
      toRate(0.03),
      BigNumber.from(365),
      BigNumber.from(2022),
      BigNumber.from(7),
      BigNumber.from(7),
      'test'
    );
  }

  public loanStartTimestamp() {
    return toTimestamp(this.loanStartTimeYear, this.loanStartTimeMonth, this.loanStartTimeDay);
  }

  public static async createAssetBond(
    tokenId: BigNumber,
    borrower: string,
    signer: string,
    principal: BigNumber,
    debtCeiling: BigNumber,
    couponRate: BigNumber,
    delinquencyRate: BigNumber,
    loanDuration: BigNumber,
    loanStartTimeYear: BigNumber,
    loanStartTimeMonth: BigNumber,
    loanStartTimeDay: BigNumber,
    ipfsHash: string
  ) {
    return new ElyfiAssetBond(
      tokenId,
      borrower,
      signer,
      principal,
      debtCeiling,
      couponRate,
      delinquencyRate,
      loanDuration,
      loanStartTimeYear,
      loanStartTimeMonth,
      loanStartTimeDay,
      ipfsHash
    );
  }
}
