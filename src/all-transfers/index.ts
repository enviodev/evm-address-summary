import { HypersyncClient, Decoder } from "@envio-dev/hypersync-client";
import {
  erc20InThreshold,
  erc20OutThreshold,
  hyperSyncEndpoint,
  ignoreErc20,
  targetAddress,
} from "./config";
import { formatEther } from "viem";

console.log(`Getting all transactions for target address: ${targetAddress}`);

// Convert address to topic for filtering. Padds the address with zeroes.
function addressToTopic(address: string): string {
  return "0x000000000000000000000000" + address.slice(2, address.length);
}

const transferEventSigHash =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

async function main() {
  console.time("Script Execution Time");

  // Create hypersync client using the mainnet hypersync endpoint
  const client = HypersyncClient.new({
    url: hyperSyncEndpoint,
    maxNumRetries: 3,
  });

  // The query to run
  const query = {
    // start from block 0 and go to the end of the chain (we don't specify a toBlock).
    fromBlock: 0,
    // The logs we want. We will also automatically get transactions and blocks relating to these logs (the query implicitly joins them).
    logs: ignoreErc20 ? [] : [
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
    traces: [{ to: [targetAddress] }, { from: [targetAddress] }],
    transactions: [
      // get all transactions coming from our address so we can calculate gas cost.
      {
        from: [targetAddress],
      }
    ],
    // Select the fields we are interested in, notice topics are selected as topic0,1,2,3
    fieldSelection: {
      transaction: ["from", "effective_gas_price", "gas_used"],
      log: ignoreErc20 ? [] : ["data", "address", "topic0", "topic1", "topic2"],
      trace: ["value", "to", "from"],
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
  let total_gas_paid = BigInt(0);
  let total_wei_volume_out = BigInt(0);
  let total_wei_volume_in = BigInt(0);

  let wei_count_in = 0;
  let wei_count_out = 0;
  let total_eoa_tx_sent = 0;

  const erc20_volumes: {
    [address: string]: {
      in: bigint;
      out: bigint;
      count_in: number;
      count_out: number;
    };
  } = {};

  while (true) {
    const res = await receiver.recv();
    if (res === null) {
      break;
    }

    console.log(`scanned up to block: ${res.nextBlock}`);

    if (!ignoreErc20) {
      // Decode the log on a background thread so we don't block the event loop.
      // Can also use decoder.decodeLogsSync if it is more convenient.
      const decodedLogs = await decoder.decodeLogs(res.data.logs);

      for (let i = 0; i < decodedLogs.length; i++) {
        const log = decodedLogs[i];
        const rawLogData = res.data.logs[i];

        // skip invalid logs
        if (
          log == undefined ||
          log.indexed.length < 2 ||
          log.body.length < 1 ||
          // log.indexed.length != 2 ||
          // log.body.length != 1 ||
          rawLogData == undefined ||
          rawLogData.address == undefined
        ) {
          continue;
        }

        const to = log.indexed[1].val as string;
        const value = log.body[0].val as bigint;
        const erc20Address = rawLogData.address.toLowerCase();
        const from = log.indexed[0].val as string;

        if (!erc20_volumes[erc20Address]) {
          erc20_volumes[erc20Address] = {
            in: BigInt(0),
            out: BigInt(0),
            count_in: 0,
            count_out: 0,
          };
        }

        if (from === targetAddress) {
          erc20_volumes[erc20Address].out += value;
          erc20_volumes[erc20Address].count_out++;
        }
        if (to === targetAddress) {
          erc20_volumes[erc20Address].in += value;
          erc20_volumes[erc20Address].count_in++;
        }
      }
    }

    // process transactions for gas
    for (const tx of res.data.transactions) {
      // If we get all value transfers from traces we can remove this.
      if (tx.gasUsed == undefined || tx.effectiveGasPrice == undefined || tx.from == undefined) {
        console.log("values are undefined"); https://github.com/enviodev/hypersync-infra/pull/136
        continue;
      }

      if (tx.from === targetAddress) {
        total_eoa_tx_sent += 1;
        total_gas_paid += BigInt(tx.effectiveGasPrice) * BigInt(tx.gasUsed);
      }
    }

    // process traces for all ether 'value' movements (internal and external)
    for (const tx of res.data.traces) {
      if (!tx.from || !tx.to || tx.value == undefined) {
        console.log("values are undefined");
        continue;
      }

      if (tx.from === targetAddress) {
        wei_count_out++;
        total_wei_volume_out += BigInt(tx.value);
      } else if (tx.to === targetAddress) {
        wei_count_in++;
        total_wei_volume_in += BigInt(tx.value);
      }
      // else {
      //   console.log("Invalid trace data, neither from nor to is the target address");
      // }
    }

  }
  console.timeEnd("Script Execution Time");

  // Print the collected information
  console.log(
    `Total # of transactions made by account - Ether IN tx: ${wei_count_in}, Ether OUT tx: ${wei_count_out}, txs paid for (EOA): ${total_eoa_tx_sent}`
  );
  console.log(`Resulting Ether Balance: ${formatEther(total_wei_volume_in - total_wei_volume_out - total_gas_paid)}`);
  console.log(`  Total Ether volume in:  ${formatEther(total_wei_volume_in)}`);
  console.log(`  Total Ether volume out: ${formatEther(total_wei_volume_out)}`);
  console.log(`  Total gas paid:         ${formatEther(total_gas_paid)}`);
  if (!ignoreErc20) {
    console.log("ERC20 token transactions and volumes:");
    for (const [address, volume] of Object.entries(erc20_volumes)) {
      if (
        volume.count_in >= erc20InThreshold &&
        volume.count_out >= erc20OutThreshold
      ) {
        console.log(`Token: ${address} `);
        console.log(
          `  Total # of ERC20 transactions - in: ${volume.count_in} out: ${volume.count_out} `
        );
        console.log(`  Total ERC20 balance: ${volume.in - volume.out} `);
        console.log(`    Total ERC20 volume in: ${volume.in} `);
        console.log(`    Total ERC20 volume out: ${volume.out} `);
      }
    }
  }
}

main();
