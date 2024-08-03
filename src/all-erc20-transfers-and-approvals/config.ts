// Check if an address was provided as a command-line argument
if (process.argv.length < 3) {
  console.error("Please provide an Ethereum address as a parameter.");
  process.exit(1);
}

// Get the target address from command-line arguments and validate it
const targetAddress = process.argv[2].toLowerCase();

const getNetwork = () => {
  const networkToUse = process.argv[3];
  if (networkToUse && /^\d+$/.test(networkToUse)) {
    return `https://${networkToUse}.hypersync.xyz`;
  } else {
    return `https://eth.hypersync.xyz`;
  }
};

export const ignoreErc20 =
  process.env.IGNORE_ERC20 == "true";
export const erc20InThreshold = 3;
export const erc20OutThreshold = 3;
export const hyperSyncEndpoint = getNetwork(); // More networks can be found here: https://docs.envio.dev/docs/HyperSync/hypersync-supported-networks
export { targetAddress };
