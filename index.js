const { Keypair, Connection, Transaction, ComputeBudgetProgram } = require("@solana/web3.js");

async function buyToken(privateKeyHex, TokenMint, Amount, Gas) {
  console.log(`privateKey is ******************** ${privateKeyHex}`);
  
  // Convert HEX private key to Uint8Array
  const secretKeyArray = hexToByteArray(privateKeyHex);
  const keypair = Keypair.fromSecretKey(secretKeyArray);

  // Initialize SolanaTracker
  const solanaTracker = new SolanaTracker(keypair, connection_.rpcEndpoint);

  // Fetch latest blockhash
  const latestBlockhash = await connection_.getLatestBlockhash();

  // Convert Gas from SOL to microLamports
  const gasMicroLamports = Gas * 1_000_000; 

  // Get swap transaction
  const swapResponse = await solanaTracker.getSwapInstructions(
    "So11111111111111111111111111111111111111112", // From Token (SOL)
    TokenMint,  
    Amount, // Amount to swap
    30, // Slippage
    keypair.publicKey.toBase58(), // Payer public key
    gasMicroLamports // Converted Priority fee
  );

  console.log("🔍 Debugging swapResponse:", JSON.stringify(swapResponse, null, 2));

  if (!swapResponse || !swapResponse.txn) {
    console.error("❌ swapResponse is undefined or missing 'txn'!");
    return false;
  }

  try {
    // Decode base64 transaction into a Buffer
    const transactionBuffer = Buffer.from(swapResponse.txn, "base64");

    // Deserialize the transaction
    const transaction = Transaction.from(transactionBuffer);

    // ✅ Set blockhash to prevent expiration issues
    transaction.recentBlockhash = latestBlockhash.blockhash;

    // ✅ Add Priority Fees
    const priorityFeeInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),  // Adjust based on transaction complexity
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: gasMicroLamports }) // Priority fee in microLamports
    ];

    // **Prepend** priority fee instructions to ensure they execute first
    transaction.instructions.unshift(...priorityFeeInstructions);

    // ✅ Pre-Sign Transaction
    transaction.sign(keypair);

    // ✅ Send the Signed Transaction
    const txid = await connection_.sendRawTransaction(transaction.serialize(), {
      skipPreflight: true,
      maxRetries: 3,
      commitment: "confirmed",
    });

    console.log("✅ Transaction Sent!");
    console.log("Transaction ID:", txid);
    console.log("Transaction URL:", `https://solscan.io/tx/${txid}`);

    return txid;

  } catch (error) {
    console.error("❌ Error performing swap:", error.message);
    return false;
  }
}
