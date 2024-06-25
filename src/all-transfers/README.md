# All Transfers

This is a script that retrieves all token transfers for a given address on the Ethereum blockchain, both native asset transfers and erc20 (and ERC721 transfers).

**Short-comings: This script treats ERC721 transfers as ERC20 transfers, since at the event level erc721 is indistinguishable from ERC20 tokens.**

## Usage

To start the script, use the following command, replacing `<your address>` with the Ethereum address you want to analyze:

```sh
pnpm all-transfers <your address>
```

## Functionality

The script scans the entire Ethereum blockchain (from block 0 to the present) and retrieves all relevant transactions for the given address. It iterates through these transactions and sums up their values to calculate aggregates for each token.

## Configuration

Since there are many spam ERC20 tokens, we added a configuration file (`config.ts`) that allows you to filter the printed terminal output. By default, it only shows ERC20 tokens that have either more than 3 transfers in or more than 3 transfers out.

You can adjust the `erc20InThreshold` and `erc20OutThreshold` values thresholds in `config.ts`.

