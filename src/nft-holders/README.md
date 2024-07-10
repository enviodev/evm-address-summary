# All Transfers

This is a script that retrieves all NFT transfers.

**Short-comings: This script will behave weirdly if you pass in an ERC20 token rather than an NFT.**

## Usage

To start the script, use the following command, replacing `<an nft contract address>` with the Ethereum address you want to analyze:

```sh
pnpm nft-holders <an nft address>
```

## Functionality

The script scans the entire Ethereum blockchain (from block 0 to the present) and retrieves all token transfer events for an ERC721 address. It records all the owners of these tokens, and how many tokens they have traded in the past.

## Configuration

Since there are often many holders of a token, we added a configuration file (`config.ts`) that allows you to filter the printed terminal output. By default, it only shows user addresses with 10 NFT. You can adjust the `holdDispalyThreshold` to adjust the threshold `config.ts`.

Additionally some NFTs do not have indexed fields on the `to`, `from` and `tokenId` despite this being part of the ERC721 standard. To get around this you can set the following enviornment variable: `export NOT_INDEXED_TO_FROM=true`. Some early NFTs that don't implement the standard indexed fields CryptoKitties (0x06012c8cf97bead5deae237070f9587f8e7a266d).

## Examples

ENS example:
```
pnpm nft-holders 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85
```

CrypoKitties example:
```
NOT_INDEXED_TO_FROM=true npm nft-holders 0x06012c8cf97bead5deae237070f9587f8e7a266d
```


