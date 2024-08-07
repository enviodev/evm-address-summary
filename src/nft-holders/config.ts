// Check if an address was provided as a command-line argument
if (process.argv.length < 3) {
  console.error("Please provide an Ethereum address as a parameter.");
  process.exit(1);
}

// Get the target address from command-line arguments and validate it
const targetContract = process.argv[2].toLowerCase();

if (!/^0x[a-fA-F0-9]{40}$/.test(targetContract)) {
  console.error("Invalid Ethereum address provided.");
  process.exit(1);
}

export const holdDispalyThreshold = 10;
export const hasIndexedToAndFromTopics =
  process.env.NOT_INDEXED_TO_FROM != "true"; // If you want to run this on NFTs such as crypto-kitties, you'll need this on since those NFTs don't conform to the standard.
export const hyperSyncEndpoint = "https://eth.hypersync.xyz"; // More networks can be found here: https://docs.envio.dev/docs/HyperSync/hypersync-supported-networks
export { targetContract };
