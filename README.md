# Address-Transactions

This project provides tools to fetch token transfers, including native assets, ERC20, and ERC721 tokens from an EVM blockchain. Each script within this project focuses on a specific aspect of transaction analysis and is designed to be small, standalone, and easily adaptable for various needs.

The outputs of these scripts are primarily displayed on the terminal, but can also be extended to save results in a database or file, depending on the user's requirements.

## Getting Started

### Installation

Before running any scripts, ensure you have installed the required packages:

```sh
pnpm install
```

### Example Address

For testing these scripts, e.g:

```
pnpm run all-erc20-transfers-and-approvals 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### Usage

This project contains multiple scripts, each serving a different purpose. Here is how you can use each script:

1. **All Transfers**:
   To analyze all token transfers for a specific Ethereum address (uses traces for native token balance calculations):

   ```sh
   pnpm run all-transfers <your address>
   ```

   **Note:** Since this script uses traces for analyzing native token transfers, it is only supported on selected networks that provide trace data. Simply remove the traces section if you wish for other networks.

2. **NFT Holders**:
   To fetch information about holders of a specific NFT:

   ```sh
   pnpm run nft-holders <an NFT address>
   ```

   For more details, see the [NFT Holders README](./src/nft-holders/README.md).

3. **ERC20 Transfers and Approvals**:
   To analyze ERC20 token transfers and approvals for a specific Ethereum address:

   ```sh
   pnpm run all-erc20-transfers-and-approvals <your address>
   ```

   For more details, see the [ERC20 Transfers and Approvals README](./src/all-erc20-transfers-and-approvals/README.md).

Replace `<your address>` with the Ethereum address you want to analyze.

## Functionality

The scripts scan the Ethereum blockchain from the genesis block to the most recent one, retrieving all relevant transactions for the given address. They iterate through these transactions and calculate aggregates for each token type encountered.

## Configuration

Each script includes a `config.ts` file which can be modified to adjust settings such as the blockchain endpoint. The `hyperSyncEndpoint` variable in `config.ts` is crucial for defining the blockchain source, and you can switch between different EVM-compatible networks by updating this variable with a new [network endpoint](https://docs.envio.dev/docs/HyperSync/hypersync-supported-networks).
