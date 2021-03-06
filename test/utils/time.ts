import { BigNumber } from 'ethers';
import { waffle, ethers } from 'hardhat';
import { Executor } from '../../typechain';
import { Proposal } from './proposal';

export function toTimestamp(year: BigNumber, month: BigNumber, day: BigNumber, hour?: BigNumber) {
  if (hour == undefined) {
    return BigNumber.from(
      Date.UTC(year.toNumber(), month.sub(1).toNumber(), day.toNumber()) / 1000
    );
  }
  return BigNumber.from(
    Date.UTC(year.toNumber(), month.sub(1).toNumber(), day.toNumber(), hour.toNumber()) / 1000
  );
}

export async function advanceBlock() {
  return waffle.provider.send('evm_mine', []);
}

export async function advanceBlockTo(to: number) {
  for (let i = await waffle.provider.getBlockNumber(); i < to; i++) {
    await advanceBlock();
  }
}

export async function advanceBlockFromTo(from: number, to: number) {
  for (let i = from; i < to; i++) {
    await advanceBlock();
  }
}

export async function advanceTime(secondsToIncrease: number) {
  await waffle.provider.send('evm_increaseTime', [secondsToIncrease]);
  return await advanceBlock();
}

export async function advanceTimeTo(current: BigNumber, target: BigNumber) {
  const secondsToIncrease = target.sub(current).toNumber();
  await waffle.provider.send('evm_increaseTime', [secondsToIncrease]);
  return await advanceBlock();
}

// fixture can't clean the provider blockNumber because of the cached block data by ethers.
export async function advanceBlockToProposalEnd(proposal: Proposal) {
  await advanceBlockTo(proposal.endBlock.toNumber());
}

export async function advanceTimeToProposalEta(proposal: Proposal) {
  const secondsToIncrease = proposal.delay.toNumber();
  await waffle.provider.send('evm_increaseTime', [secondsToIncrease]);
  return await waffle.provider.send('evm_mine', []);
}

export async function saveEVMSnapshot(): Promise<string> {
  const snapshotId = await waffle.provider.send('evm_snapshot', []);
  return snapshotId;
}

export async function revertFromEVMSnapshot(snapshotId: string) {
  await waffle.provider.send('evm_revert', [snapshotId]);
}

export async function getTimestamp(tx: any) {
  return BigNumber.from((await waffle.provider.getBlock(tx.blockNumber)).timestamp);
}
