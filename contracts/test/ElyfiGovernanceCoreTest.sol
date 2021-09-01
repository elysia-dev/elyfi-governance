// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../core/ElyfiGovernanceCore.sol';

import '@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol';

contract ElyfiGovernanceCoreTest is ElyfiGovernanceCore {
  uint256 immutable _votingDelay;
  uint256 immutable _votingPeriod;

  constructor(
    TimelockController _timelock,
    uint256 votingDelay_,
    uint256 votingPeriod_
  ) ElyfiGovernanceCore(_timelock) {
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
