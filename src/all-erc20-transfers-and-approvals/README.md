# ERC20 Transfers and Approvals

This script retrieves all ERC20 token transfer and approval events for a given address on an EVM chain.

This script is for educational purposes, and care should be taken to understand the intricacies and low level edge cases of different erc20 tokens before puting it into production.


## Usage

To start the script, use the following command, replacing `<your address>` with the Ethereum address you want to analyze:

```sh
pnpm all-erc20-transfers-and-approvals <your address> <network-id (optional)>
```

The 3rd argument, network ID, is optional. If not provided, the script defaults to Ethereum.

## Functionality

The script scans the entire Ethereum blockchain (from block 0 to the present) and retrieves all ERC20 transfer and approval events for the given address. It calculates the following:

1. Token balances: Summing up all incoming and outgoing transfers for each token.
2. Token transaction counts: Counting the number of incoming and outgoing transactions for each token.
3. Approvals: Tracking approvals for each token, including the spender and approved amount.

## Important Notes:

- This will have calculation errors on rebasing tokens such as stETH, rebasing information isn't captured by the events that this script looks at.
  - Other non-standard ERC20 token variations can cause issue, so keep that in mind if adapting to your use case.
- This script also captures ERC721 transfers, as they are indistinguishable from ERC20 transfers at the event level and HyperSync doesn't filter based on number of indexed parameters currently.
- Due to the way erc20 was design, it is impossible to accurately track changes to allowances only with events, without using traces. This script only tracks approvals via events and does not track changes to allowances via transfers since the 'spender' isn't recorded in Transfer events.
- There are lots of spam tokens, that don't follow the standard erc20 standard and can apear to give strange results. Etherscan (and other block explorers) are a good place to validate if a token is spam.

## Configuration

Since there are many spam ERC20 tokens, we added a configuration file (`config.ts`) that allows you to filter the printed terminal output. By default, it only shows ERC20 tokens that have either more than 3 transfers in or more than 3 transfers out.

You can adjust the `erc20InThreshold` and `erc20OutThreshold` values thresholds in `config.ts`.
