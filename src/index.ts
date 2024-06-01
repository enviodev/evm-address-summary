import { HypersyncClient, Decoder } from "@envio-dev/hypersync-client";

// The addresses we want to get data for
const targetAddress = "0x89e51fa8ca5d66cd220baed62ed01e8951aa7c40".toLowerCase();

// Convert address to topic for filtering. Padds the address with zeroes.
function addressToTopic(address: string): string {
  return "0x000000000000000000000000" + address.slice(2, address.length);
}

const transferEventSigHash = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

async function main() {
  // Create hypersync client using the mainnet hypersync endpoint
  const client = HypersyncClient.new({
    url: "http://eth.backup.hypersync.xyz",
    maxNumRetries: 0,
  });

  // The query to run
  const query = {
    // start from block 0 and go to the end of the chain (we don't specify a toBlock).
    fromBlock: 0,
    // The logs we want. We will also automatically get transactions and blocks relating to these logs (the query implicitly joins them).
    logs: [
      {
        // We want All ERC20 transfers coming to any of our addresses
        topics: [
          [transferEventSigHash],
          [],
          [addressToTopic(targetAddress)],
          [],
        ],
      },
      {
        // We want All ERC20 transfers going from any of our addresses
        topics: [
          [transferEventSigHash],
          [addressToTopic(targetAddress)],
          [],
          [],
        ],
      },
    ],
    transactions: [
      // get all transactions coming from and going to any of our addresses.
      {
        from: [targetAddress],
      },
      {
        to: [targetAddress],
      },
    ],
    // Select the fields we are interested in, notice topics are selected as topic0,1,2,3
    fieldSelection: {
      transaction: ["from", "to", "value"],
      log: ["data", "address", "topic0", "topic1", "topic2"],
    },
  };

  console.log("Running the query...");

  const receiver = await client.stream(query, {
    concurrency: 48,
    maxBatchSize: 10000,
  });

  const decoder = Decoder.fromSignatures([
    "Transfer(address indexed from, address indexed to, uint amount)",
  ]);

  // Let's count total volume for each address, it is meaningless because of currency differences but good as an example.
  let total_wei_volume_in = BigInt(0);
  let total_wei_volume_out = BigInt(0);
  let transaction_count = 0;

  const erc20_volumes: { [address: string]: { in: bigint, out: bigint, count: number } } = {};

  while (true) {
    const res = await receiver.recv();
    if (res === null) {
      break;
    }

    console.log(`scanned up to block: ${res.nextBlock}`);

    // Decode the log on a background thread so we don't block the event loop.
    // Can also use decoder.decodeLogsSync if it is more convenient.
    const decodedLogs = await decoder.decodeLogs(res.data.logs);

    for (let i = 0; i < decodedLogs.length; i++) {
      const log = decodedLogs[i];
      const rawLogData = res.data.logs[i];

      // Use this address as the address of the ERC20 token

      // skip invalid logs
      if (log == undefined || log.indexed.length < 2 || log.body.length < 1 || rawLogData == undefined || rawLogData.address == undefined) {
        continue;
      }

      const to = log.indexed[1].val as string;
      const value = log.body[0].val as bigint;
      const address = rawLogData.address.toLowerCase();
      const from = log.indexed[0].val as string;

      if (!erc20_volumes[address]) {
        erc20_volumes[address] = { in: BigInt(0), out: BigInt(0), count: 0 };
      }

      if (from.toLowerCase() === targetAddress) {
        erc20_volumes[address].out += value;
        erc20_volumes[address].count++;
      }
      if (to.toLowerCase() === targetAddress) {
        erc20_volumes[address].in += value;
        erc20_volumes[address].count++;
      }
    }

    for (const tx of res.data.transactions) {
      if (!tx.from || !tx.to || tx.value == undefined) {
        console.log("values are undefined");
        continue;
      }

      transaction_count++;
      total_wei_volume_out += tx.from.toLowerCase() === targetAddress ? BigInt(tx.value) : BigInt(0);
      total_wei_volume_in += tx.to.toLowerCase() === targetAddress ? BigInt(tx.value) : BigInt(0);
    }
  }

  // Print the collected information
  console.log(`Total # of transactions made by account: ${transaction_count}`);
  console.log(`Total Ether volume in: ${total_wei_volume_in}`);
  console.log(`Total Ether volume out: ${total_wei_volume_out}`);
  console.log("ERC20 token transactions and volumes:");

  for (const [address, volume] of Object.entries(erc20_volumes)) {
    console.log(`Token: ${address}`);
    console.log(`  Total # of ERC20 transactions: ${volume.count}`);
    console.log(`  Total ERC20 volume in: ${volume.in}`);
    console.log(`  Total ERC20 volume out: ${volume.out}`);
  }
}

main();

