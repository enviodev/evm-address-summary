import { HypersyncClient, Decoder } from "@envio-dev/hypersync-client";
import {
  hasIndexedToAndFromTopics,
  holdDispalyThreshold,
  hyperSyncEndpoint,
  targetContract,
} from "./config";

const transferEventSigHash =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // ERC721 Transfer event signature

async function main() {
  console.time("Script Execution Time");

  const client = HypersyncClient.new({ url: hyperSyncEndpoint });

  const query = {
    fromBlock: 0,
    logs: [
      {
        address: [targetContract],
        topics: [[transferEventSigHash]],
      },
    ],
    fieldSelection: {
      block: ["timestamp"],
      log: ["data", "topic0", "topic1", "topic2", "topic3"],
    },
  };

  console.log("Running the query...");

  const receiver = await client.streamEvents(query, {});

  const decoder = Decoder.fromSignatures([
    hasIndexedToAndFromTopics
      ? "Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      : "Transfer(address from, address to, uint256 tokenId)",
  ]);

  const nftInteractions: {
    [address: string]: {
      tokenIds: Set<bigint>;
      transfersIn: number;
      transfersOut: number;
    };
  } = {};

  let totalTransfers = 0;
  while (true) {
    const res = await receiver.recv();
    if (res === null) break;

    totalTransfers += res.data.length;
    console.log(
      `scanned up to block: ${res.nextBlock}, total transfers: ${totalTransfers}`
    );

    const decodedLogs = await decoder.decodeEvents(res.data);

    for (let i = 0; i < decodedLogs.length; i++) {
      const log = decodedLogs[i];
      const rawLogData = res.data[i];

      if (
        !log ||
        !rawLogData.block ||
        !log.indexed ||
        !log.body ||
        log.indexed.length < (hasIndexedToAndFromTopics ? 2 : 0) ||
        log.body.length < (hasIndexedToAndFromTopics ? 0 : 3)
      ) {
        continue;
      }

      const from = (hasIndexedToAndFromTopics ? log.indexed[0] : log.body[0])
        .val as string;
      const to = (hasIndexedToAndFromTopics ? log.indexed[1] : log.body[1])
        .val as string;
      const tokenId = (hasIndexedToAndFromTopics ? log.indexed[2] : log.body[2])
        .val as bigint;

      if (!nftInteractions[from]) {
        nftInteractions[from] = {
          tokenIds: new Set(),
          transfersIn: 0,
          transfersOut: 0,
        };
      }

      if (!nftInteractions[to]) {
        nftInteractions[to] = {
          tokenIds: new Set(),
          transfersIn: 0,
          transfersOut: 0,
        };
      }

      nftInteractions[from].tokenIds.delete(tokenId);
      nftInteractions[from].transfersOut += 1;

      nftInteractions[to].tokenIds.add(tokenId);
      nftInteractions[to].transfersIn += 1;

      // console.log(`From: ${from}, To: ${to}, Token ID: ${tokenId}`);
    }
  }

  console.log("Summary of addresses owning more than 10 tokens:");
  for (const [address, interaction] of Object.entries(nftInteractions)) {
    console.log(
      `Address: ${address}, Token IDs: ${Array.from(interaction.tokenIds).join(", ")}`
    );
    if (interaction.tokenIds.size > holdDispalyThreshold) {
      console.log(`Address: ${address}`);
      console.log(
        `  Token IDs: ${Array.from(interaction.tokenIds).join(", ")}`
      );
      console.log(`  Total Transfers In: ${interaction.transfersIn}`);
      console.log(`  Total Transfers Out: ${interaction.transfersOut}`);
    }
  }

  console.timeEnd("Script Execution Time");
}

main();
