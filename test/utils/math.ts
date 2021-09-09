import { BigNumber } from 'ethers';

// Underflow error, need refactor
export function toIndex(m: number): BigNumber {
  return BigNumber.from(m * 1000).mul(BigNumber.from(10).pow(24));
}

// Underflow error, need refactor
export function toRate(m: number): BigNumber {
  return BigNumber.from(m * 1000).mul(BigNumber.from(10).pow(24));
}
