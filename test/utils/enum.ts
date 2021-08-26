export enum ProposalState {
  pending = 'Pending',
  active = 'Active',
  canceled = 'Canceled',
  defeated = 'Defeated',
  succeeded = 'Succeeded',
  queued = 'Queued',
  expired = 'Expired',
  executed = 'Executed',
}

export enum VoteType {
  against = 'Against',
  for = 'For',
  abstain = 'Abstain',
}
