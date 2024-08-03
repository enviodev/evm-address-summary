# All Transfers

This is a script that retrieves all token transfers for a given address on the Ethereum blockchain, both native asset transfers and erc20 (and ERC721 transfers).

To get the native asset transfers, we require use of traces, so only HyperSync networks that support traces can use this script.

**NOTE: This script also loads ERC721 transfers, since at they have the same signature/topic0. However, they aren't counted as ERC20 transfers, since they have different number of indexed parameters.**

## Usage

To start the script, use the following command, replacing `<your address>` with the Ethereum address you want to analyze:

```sh
pnpm all-transfers <your address>
```

## Functionality

The script scans the entire Ethereum blockchain (from block 0 to the present) and retrieves all relevant transactions for the given address. It iterates through these transactions and sums up their values to calculate aggregates for each token.

## Important Notes:

- This will have calculation errors on rebasing tokens such as stETH, rebasing information isn't captured by the events that this script looks at.
  - Other non-standard ERC20 token variations can cause issue, so keep that in mind if adapting to your use case.
- This script also captures ERC721 transfers, as they are indistinguishable from ERC20 transfers at the event level and HyperSync doesn't filter based on number of indexed parameters currently.
- There are lots of spam tokens, that don't follow the standard erc20 standard and can apear to give strange results. Etherscan (and other block explorers) are a good place to validate if a token is spam.

## Configuration

Since there are many spam ERC20 tokens, we added a configuration file (`config.ts`) that allows you to filter the printed terminal output. By default, it only shows ERC20 tokens that have either more than 3 transfers in or more than 3 transfers out.

You can adjust the `erc20InThreshold` and `erc20OutThreshold` values thresholds in `config.ts`.

