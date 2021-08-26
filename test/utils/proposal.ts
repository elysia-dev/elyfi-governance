import { Bytes } from '@ethersproject/bytes';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { ProposalState } from './enum';

export class Proposal {
  targets: string[];
  values: BigNumber[];
  callDatas: string[];
  description: string;
  id: BigNumber;
  state: ProposalState;

  constructor(targets: string[], values: BigNumber[], callDatas: string[], description: string) {
    this.targets = targets;
    this.values = values;
    this.callDatas = callDatas;
    this.description = description;
    this.id = BigNumber.from(0);
    this.state = ProposalState.active;
  }

  public async setProposalId(id: BigNumber) {
    this.id = id;
  }

  public static async createProposal(
    targets: string[],
    values: BigNumber[],
    callDatas: string[],
    description: string
  ) {
    return new Proposal(targets, values, callDatas, description);
  }
}
