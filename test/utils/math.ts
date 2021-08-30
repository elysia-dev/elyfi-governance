import { BigNumber } from 'ethers';

// Underflow error, need refactor
export function toIndex(m: number): BigNumber {
  return BigNumber.from(m * 1000).mul(BigNumber.from(10).pow(24));
}

// Underflow error, need refactor
export function toRate(m: number): BigNumber {
  return BigNumber.from(m * 1000).mul(BigNumber.from(10).pow(24));
}

export const MAX_UINT_AMOUNT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935';
