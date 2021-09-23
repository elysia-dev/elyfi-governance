// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../core/ElyfiGovernanceCore.sol';

contract ElyfiGovernanceCoreTest is ElyfiGovernanceCore {
  uint256 immutable _votingDelay;
  uint256 immutable _votingPeriod;

  constructor(
    TimelockController timelock,
    uint256 votingDelay_,
    uint256 votingPeriod_
  ) ElyfiGovernanceCore(timelock) {
    _votingDelay = votingDelay_;
    _votingPeriod = votingPeriod_;
  }

  receive() external payable {}

  function votingDelay() public view override returns (uint256) {
    return _votingDelay;
  }

  function votingPeriod() public view override returns (uint256) {
    return _votingPeriod;
  }
}
