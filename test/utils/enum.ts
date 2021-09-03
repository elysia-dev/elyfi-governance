export enum ProposalState {
  pending,
  active,
  canceled,
  defeated,
  succeeded,
  queued,
  expired,
  executed,
}

export enum VoteType {
  against,
  for,
  abstain,
}

export enum AssetBondState {
  EMPTY,
  SETTLED,
  CONFIRMED,
  COLLATERALIZED,
  DELINQUENT,
  REDEEMED,
  LIQUIDATED,
}
