# address-transactions

This is a project for getting all the fungible (native asset and ERC20 token) transfers from an EVM blockchain for a given address.

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

Since there are many spam ERC20 tokens, we added a configuration file (`config.ts`) that allows you to filter the printed terminal output. By default, it only shows ERC20 tokens that have either more than 3 transfers in or more than 3 transfers out.

You can adjust the `erc20InThreshold` and `erc20OutThreshold` values thresholds in `config.ts`.

You can also query other supported EVM networks by updating the `hyperSyncEndpoint` variable with another [network endpoint](https://docs.envio.dev/docs/hypersync-url-endpoints).



