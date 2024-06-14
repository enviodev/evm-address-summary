import { HypersyncClient, Decoder } from "@envio-dev/hypersync-client";
import {
  hyperSyncEndpoint,
  targetAddress,
} from "./config";

const transferEventSigHash =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; // ERC721 Transfer event signature

async function main() {
  console.time("Script Execution Time");

  // Create hypersync client using the mainnet hypersync endpoint
  const client = HypersyncClient.new({
    url: hyperSyncEndpoint,
  });

  // The query to run
  const query = {
    fromBlock: 4605167,
    logs: [
      {
        address: [targetAddress],
        topics: [
          [transferEventSigHash],
        ],
      },
    ],
    fieldSelection: {
      block: ["timestamp"],
      log: ["data", "topic0", "topic1", "topic2"],
    },
  };

  console.log("Running the query...");

  const receiver = await client.streamEvents(query, {});

  const decoder = Decoder.fromSignatures([
    "Transfer(address indexed from, address indexed to, uint256 tokenId)",
  ]);

  // Let's track NFT interactions for each address
  const nftInteractions = {};

  while (true) {
    const res = await receiver.recv();
    if (res === null) {
      break;
    }

    console.log(`scanned up to block: ${res.nextBlock}`);
    console.log(res)
    console.log("number of logs found", res.data.length)


    const decodedLogs = await decoder.decodeEvents(res.data);
    console.log("decoded logs", decodedLogs.length, res.data.length)
    for (let i = 0; i < decodedLogs.length; i++) {
      // console.log("looping through logs")
      const log = decodedLogs[i];
      const rawLogData = res.data[i];
      console.log("log", rawLogData)

      if (
        log == undefined || rawLogData.block == undefined
      ) {
        continue;
      }

      const from = log.indexed[0].val as string;
      const to = log.indexed[1].val as string;
      const tokenId = log.body[0].val as bigint;
      console.log("info I care about")
      // const timestamp = res.data.transactions[i].timestamp;
      //
      // if (!nftInteractions[nftAddress]) {
      //   nftInteractions[nftAddress] = {};
      // }
      //
      // if (!nftInteractions[nftAddress][from]) {
      //   nftInteractions[nftAddress][from] = {};
      // }
      //
      // if (!nftInteractions[nftAddress][to]) {
      //   nftInteractions[nftAddress][to] = {};
      // }
      //
      // if (!nftInteractions[nftAddress][from][tokenId]) {
      //   nftInteractions[nftAddress][from][tokenId] = {
      //     transfersOut: 0,
      //     lastInteraction: timestamp,
      //   };
      // }
      //
      // if (!nftInteractions[nftAddress][to][tokenId]) {
      //   nftInteractions[nftAddress][to][tokenId] = {
      //     transfersIn: 0,
      //     lastInteraction: timestamp,
      //   };
      // }
      //
      // if (from === targetAddress) {
      //   nftInteractions[nftAddress][from][tokenId].transfersOut++;
      //   nftInteractions[nftAddress][from][tokenId].lastInteraction = timestamp;
      // }
      // if (to === targetAddress) {
      //   nftInteractions[nftAddress][to][tokenId].transfersIn++;
      //   nftInteractions[nftAddress][to][tokenId].lastInteraction = timestamp;
      // }
    }
  }

  console.timeEnd("Script Execution Time");

  // console.log("NFT interactions:");
  // for (const [address, users] of Object.entries(nftInteractions)) {
  //   console.log(`NFT Contract: ${address}`);
  //   for (const [user, tokens] of Object.entries(users)) {
  //     console.log(`  User Address: ${user}`);
  //     for (const [tokenId, data] of Object.entries(tokens)) {
  //       console.log(`    Token ID: ${tokenId}`);
  //       if (data.transfersIn !== undefined) {
  //         console.log(`      Transfers In: ${data.transfersIn}`);
  //       }
  //       if (data.transfersOut !== undefined) {
  //         console.log(`      Transfers Out: ${data.transfersOut}`);
  //       }
  //       console.log(`      Last Interaction: ${new Date(data.lastInteraction * 1000)}`);
  //     }
  //   }
  // }
}
  
main();

