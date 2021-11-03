import { BigNumber, Bytes, utils } from 'ethers';
import { formatBytesString } from './bytes';
import { ProposalState } from './enum';

export class Proposal {
  targets: string[];
  values: BigNumber[];
  callDatas: string[];
  description: string;
  descriptionHash: string;
  id: BigNumber;
  state: ProposalState;
  startBlock: BigNumber;
  endBlock: BigNumber;
  delay: BigNumber;
  eta?: BigNumber;

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

    const descriptionHash = utils.keccak256(formatBytesString(description));
    this.descriptionHash = descriptionHash;
  }

  public static createProposal(
    targets: string[],
    values: BigNumber[],
    callDatas: string[],
    description: string
  ) {
    return new Proposal(targets, values, callDatas, description);
  }
}
