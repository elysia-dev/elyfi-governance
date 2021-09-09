// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import './ERC1155Tradable.sol';

contract RewardBadge is ERC1155Tradable {
  constructor()
    ERC1155Tradable('uri', 'name', 'symbol', 0x7236619eBb70C87DAbeE72e19bEb2985360a7c10)
  {}
}
