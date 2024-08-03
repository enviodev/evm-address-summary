# Address-Transactions

This project provides tools to fetch token transfers, including native assets, ERC20, and ERC721 tokens from an EVM blockchain. Each script within this project focuses on a specific aspect of transaction analysis and is designed to be small, standalone, and easily adaptable for various needs.

The outputs of these scripts are primarily displayed on the terminal, but can also be extended to save results in a database or file, depending on the user's requirements.

## Getting Started

### Installation

Before running any scripts, ensure you have installed the required packages:

```sh
pnpm install
```

### Usage
This project contains multiple scripts, each serving a different purpose. Here is how you can use each script:

1. **All Transfers**:
   To analyze all token transfers for a specific Ethereum address:

   ```sh
   pnpm run all-transfers <your address>
   ```

   For more details, see the [All Transfers README](./src/all-transfers/README.md).

2. **NFT Holders**:
   To fetch information about holders of a specific NFT:
   ```sh
   pnpm run nft-holders <your address>
   ```

   For more details, see the [NFT Holders README](./src/nft-holders/README.md).

Replace `<your address>` with the Ethereum address you want to analyze.

## Functionality

The scripts scan the Ethereum blockchain from the genesis block to the most recent one, retrieving all relevant transactions for the given address. They iterate through these transactions and calculate aggregates for each token type encountered.

## Configuration

Each script includes a `config.ts` file which can be modified to adjust settings such as the blockchain endpoint. The `hyperSyncEndpoint` variable in `config.ts` is crucial for defining the blockchain source, and you can switch between different EVM-compatible networks by updating this variable with a new [network endpoint](https://docs.envio.dev/docs/hypersync-url-endpoints).
