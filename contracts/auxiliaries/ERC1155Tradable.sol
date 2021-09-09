// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

import '../interfaces/IERC1155Tradable.sol';

contract OwnableDelegateProxy {}

contract ProxyRegistry {
  mapping(address => OwnableDelegateProxy) public proxies;
}

contract ERC1155Tradable is IERC1155Tradable, ERC1155Supply, AccessControl {
  using Strings for uint256;

  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

  address public proxyRegistryAddress;
  // Contract name
  string public name;
  // Contract symbol
  string public symbol;

  constructor(
    string memory uri_,
    string memory name_,
    string memory symbol_,
    address proxyRegistryAddress_
  ) ERC1155(uri_) {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(MINTER_ROLE, msg.sender);

    name = name_;
    symbol = symbol_;
    proxyRegistryAddress = proxyRegistryAddress_;
  }

  function setURI(string memory newUri) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setURI(newUri);
  }

  // The following functions are overrides required by Solidity.
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC1155, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  function uri(uint256 id) public view override returns (string memory) {
    require(exists(id), 'Not existing token');
    string memory concatUri = string(abi.encodePacked(super.uri(id), id.toString()));
    return concatUri;
  }

  /**
   * @dev Mints some amount of tokens to an address
   * @param account Address of the future owner of the token
   * @param id Token ID to mint
   * @param amount Amount of tokens to mint
   * @param data Data to pass if receiver is contract
   */
  function mint(
    address account,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public override onlyRole(MINTER_ROLE) {
    _mint(account, id, amount, data);
  }

  /**
   * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-free listings.
   */
  function isApprovedForAll(address owner, address operator)
    public
    view
    override
    returns (bool isOperator)
  {
    // Whitelist OpenSea proxy contract for easy trading.
    ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
    if (address(proxyRegistry.proxies(owner)) == operator) {
      return true;
    }

    return super.isApprovedForAll(owner, operator);
  }
}
