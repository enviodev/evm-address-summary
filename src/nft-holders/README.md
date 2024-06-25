# All Transfers

This is a script that retrieves all NFT transfers.

**Short-comings: This script will behave wierdly if you pass in an ERC20 token rather than an NFT.**

## Usage

To start the script, use the following command, replacing `<an nft contract address>` with the Ethereum address you want to analyze:

```sh
pnpm nft-holders <an nft address>
```

## Functionality

The script scans the entire Ethereum blockchain (from block 0 to the present) and retrieves all token transfer events for an ERC721 address. It records all the owners of these tokens, and how many tokens they have traded in the past.

## Configuration

Since there are often many holders of a token, we added a configuration file (`config.ts`) that allows you to filter the printed terminal output. By default, it only shows user addresses with 10 NFT. You can adjust the `holdDispalyThreshold` to adjust the threshold `config.ts`.
