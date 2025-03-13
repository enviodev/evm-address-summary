import {
  HypersyncClient,
  Decoder,
  Query,
  JoinMode,
  LogField,
} from "@envio-dev/hypersync-client";
import {
  erc20InThreshold,
  erc20OutThreshold,
  hyperSyncEndpoint,
  targetAddress,
} from "./config";

console.log(
  `Getting all ERC20 transfers and approvals for target address: ${targetAddress}`
);

// Convert address to topic for filtering. Padds the address with zeroes.
function addressToTopic(address: string): string {
  return "0x000000000000000000000000" + address.slice(2, address.length);
}

const transferEventSigHash =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const approvalEventSigHash =
  "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";

async function main() {
  console.time("Script Execution Time");

  const client = HypersyncClient.new({
    url: hyperSyncEndpoint,
    maxNumRetries: 3,
  });

  const query: Query = {
    fromBlock: 0,
    logs: [
      {
        topics: [
          [transferEventSigHash],
          [addressToTopic(targetAddress)],
          [],
          [],
        ],
      },
      {
        topics: [
          [transferEventSigHash],
          [],
          [addressToTopic(targetAddress)],
          [],
        ],
      },
      {
        topics: [
          [approvalEventSigHash],
          [addressToTopic(targetAddress)],
          [],
          [],
        ],
      },
    ],
    fieldSelection: {
      log: [
        LogField.Data,
        LogField.Address,
        LogField.Topic0,
        LogField.Topic1,
        LogField.Topic2,
        LogField.Topic3,
      ],
    },
    joinMode: JoinMode.JoinNothing,
  };

  console.log("Running the query...");

  const receiver = await client.stream(query, {});

  const decoder = Decoder.fromSignatures([
    "Transfer(address indexed from, address indexed to, uint256 amount)",
    "Approval(address indexed owner, address indexed spender, uint256 value)",
  ]);

  const erc20_balances: {
    [address: string]: { balance: bigint; count_in: number; count_out: number };
  } = {};
  const erc20_approvals: { [address: string]: { [spender: string]: bigint } } =
    {};

  while (true) {
    const res = await receiver.recv();
    if (res === null) {
      break;
    }

    console.log(`scanned up to block: ${res.nextBlock}`);

    const decodedLogs = await decoder.decodeLogs(res.data.logs);

    for (let i = 0; i < decodedLogs.length; i++) {
      const log = decodedLogs[i];
      const rawLogData = res.data.logs[i];

      if (
        log == undefined ||
        log.indexed.length < 2 ||
        log.body.length < 1 ||
        rawLogData == undefined ||
        rawLogData.address == undefined
      ) {
        continue;
      }

      const erc20Address = rawLogData.address.toLowerCase();

      if (rawLogData.topics[0] === transferEventSigHash) {
        const from = log.indexed[0].val as string;
        const to = log.indexed[1].val as string;
        const value = log.body[0].val as bigint;

        if (!erc20_balances[erc20Address]) {
          erc20_balances[erc20Address] = {
            balance: BigInt(0),
            count_in: 0,
            count_out: 0,
          };
        }

        if (from === targetAddress) {
          erc20_balances[erc20Address].balance -= value;
          erc20_balances[erc20Address].count_out++;
        }
        if (to === targetAddress) {
          erc20_balances[erc20Address].balance += value;
          erc20_balances[erc20Address].count_in++;
        }
      } else if (rawLogData.topics[0] === approvalEventSigHash) {
        const owner = log.indexed[0].val as string;
        const spender = log.indexed[1].val as string;
        const value = log.body[0].val as bigint;

        if (owner === targetAddress) {
          if (!erc20_approvals[erc20Address]) {
            erc20_approvals[erc20Address] = {};
          }
          erc20_approvals[erc20Address][spender] = value;
        }
      }
    }
  }

  console.timeEnd("Script Execution Time");

  // Print the collected information
  console.log("ERC20 token balances:");
  for (const [address, data] of Object.entries(erc20_balances)) {
    if (
      data.count_in >= erc20InThreshold &&
      data.count_out >= erc20OutThreshold
    ) {
      console.log(`Token: ${address}`);
      console.log(`  Balance: ${data.balance}`);
      console.log(
        `  Total # of ERC20 transactions - in: ${data.count_in} out: ${data.count_out}`
      );
    }
  }

  console.log("\nERC20 token approvals:");
  for (const [address, approvals] of Object.entries(erc20_approvals)) {
    if (
      erc20_balances[address] &&
      erc20_balances[address].count_in >= erc20InThreshold &&
      erc20_balances[address].count_out >= erc20OutThreshold
    ) {
      console.log(`Token: ${address}`);
      for (const [spender, value] of Object.entries(approvals)) {
        console.log(`  Approved ${value} to spender: ${spender}`);
      }
    }
  }
}

main();
