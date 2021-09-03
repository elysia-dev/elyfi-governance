import { BigNumber } from 'ethers';
import { ProposalState } from './enum';

export class Proposal {
  targets: string[];
  values: BigNumber[];
  callDatas: string[];
  description: string;
  id: BigNumber;
  state: ProposalState;
  startBlock: BigNumber;
  endBlock: BigNumber;
  eta?: BigNumber;
  delay: BigNumber;

  constructor(targets: string[], values: BigNumber[], callDatas: string[], description: string) {
    this.targets = targets;
    this.values = values;
    this.callDatas = callDatas;
    this.description = description;
    this.id = BigNumber.from(0);
    this.state = ProposalState.active;
    this.startBlock = BigNumber.from(0);
    this.endBlock = BigNumber.from(0);
    this.delay = BigNumber.from(0);
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
