import { HypersyncClient, Decoder } from "@envio-dev/hypersync-client";

// The addresses we want to get data for
const addresses = [
  "0x89e51fa8ca5d66cd220baed62ed01e8951aa7c40".toLowerCase(),
];

// Convert address to topic for filtering. Padds the address with zeroes.
function addressToTopic(address: string): string {
  return "0x000000000000000000000000" + address.slice(2, address.length);
}

const transferEventSigHash = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

async function main() {
  // Create hypersync client using the mainnet hypersync endpoint
  const client = HypersyncClient.new({
    url: "http://eth.backup.hypersync.xyz",
    maxNumRetries: 0,
  });

  const addressTopicFilter = addresses.map(addressToTopic);

  // The query to run
  const query = {
    // start from block 0 and go to the end of the chain (we don't specify a toBlock).
    "fromBlock": 18000000,
    // The logs we want. We will also automatically get transactions and blocks relating to these logs (the query implicitly joins them).
    "logs": [
      {
        // We want All ERC20 transfers coming to any of our addresses
        "topics": [
          [transferEventSigHash],
          [],
          addressTopicFilter,
          [],
        ]
      },
      {
        // We want All ERC20 transfers going from any of our addresses
        "topics": [
          [transferEventSigHash],
          addressTopicFilter,
          [],
          [],
        ]
      }
    ],
    "transactions": [
      // get all transactions coming from and going to any of our addresses.
      {
        from: addresses
      },
      {
        to: addresses
      }
    ],
    // Select the fields we are interested in, notice topics are selected as topic0,1,2,3
    "fieldSelection": {
      "transaction": [
        // "block_number",
        // "transaction_index",
        // "hash",
        "from",
        "to",
        "value",
      ],
      "log": [
        "data",
        "address",
        "topic0",
        "topic1",
        "topic2"
      ],
    },
  };

  console.log("Running the query...");

  const receiver = await client.stream(query, {
    concurrency: 48,
    maxBatchSize: 10000,
  });

  console.log("Query finished, processing results...");

  const decoder = Decoder.fromSignatures([
    "Transfer(address indexed from, address indexed to, uint amount)"
  ]);

  // Let's count total volume for each address, it is meaningless because of currency differences but good as an example.
  let total_erc20_volume: { [key: string]: bigint } = {};
  let total_wei_volume: { [key: string]: bigint } = {};

  while (true) {
    const res = await receiver.recv();
    if (res === null) {
      break;
    }

    console.log(`scanned up to block: ${res.nextBlock}`);

    // Decode the log on a background thread so we don't block the event loop.
    // Can also use decoder.decodeLogsSync if it is more convenient.
    const decodedLogs = await decoder.decodeLogs(res.data.logs);

    for (const log of decodedLogs) {
      // skip invalid logs
      if (log == undefined) {
        continue;
      }

      if (!total_erc20_volume[log.indexed[0].val as string]) {
        total_erc20_volume[log.indexed[0].val as string] = BigInt(0);
      }
      if (!total_erc20_volume[log.indexed[1].val as string]) {
        total_erc20_volume[log.indexed[1].val as string] = BigInt(0);
      }
      // We count for both sides but we will filter by our addresses later so we will ignore unnecessary addresses.
      total_erc20_volume[log.indexed[0].val as string] += log.body[0].val as bigint;
      total_erc20_volume[log.indexed[1].val as string] += log.body[0].val as bigint;
    }

    for (const tx of res.data.transactions) {
      if (tx.from == undefined || tx.to == undefined || tx.value == undefined) {
        console.log("values are undefined")
        continue;
      }
      if (!total_wei_volume[tx.from]) {
        total_wei_volume[tx.from] = BigInt(0);
      }
      if (!total_wei_volume[tx.to]) {
        total_wei_volume[tx.to] = BigInt(0);
      }

      total_wei_volume[tx.from] += BigInt(tx.value);
      total_wei_volume[tx.to] += BigInt(tx.value);
    }
  }

  for (const addr of addresses) {
    console.log(`Total erc20 transfer volume for address ${addr} is ${total_erc20_volume[addr]}`);
  }

  for (const addr of addresses) {
    console.log(`Total wei transfer wolume for address ${addr} is ${total_wei_volume[addr]}`);
  }
}

main();
