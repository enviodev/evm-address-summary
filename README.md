# address-transactions

This is a project for getting token (native asset, ERC20 and ERC721 tokens) transfers from an EVM blockchain with small scripts.

Each script has its own goal, and the scripts consist of 2 files - `index.ts` and `config.ts`. The scripts are standalone, kept to a reasonably size, and can be copied and used directly or modified to your own needs. 

The output of these scripts is printed to the terminal, but the results could easily be put in a database or saved to a file.

## Getting Started

### Installation

To run the project, first install the packages with:

```sh
pnpm install
```

### Usage

To start the script, use the following command, replacing `<your address>` with the Ethereum address you want to analyze:

```sh
pnpm start <your address>
```

## Functionality

The script scans the entire Ethereum blockchain (from block 0 to the present) and retrieves all relevant transactions for the given address. It iterates through these transactions and sums up their values to calculate aggregates for each token.

## Configuration

Each script has a `config.ts` file but common to all of them is the `hyperSyncEndpoint` variable, you can also query other supported EVM networks by updating the `hyperSyncEndpoint` variable with another [network endpoint](https://docs.envio.dev/docs/hypersync-url-endpoints).



