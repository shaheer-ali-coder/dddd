const { Telegraf, Markup } = require('telegraf');
const web3 = require('@solana/web3.js');
const { Keypair, Connection } = require('@solana/web3.js')
// import { SolanaTracker } from "solana-swap";
const {SolanaTracker} = require('solana-swap')
const fs = require('fs')
const bot = new Telegraf('7952106783:AAH7ZM4K6YH567zjUdRkh9bGQ-jyiH1SE1U');
const grpcClient = require("@triton-one/yellowstone-grpc");
const axios = require('axios');
const apiKey = 'd9d1bbd0-bc01-4388-acc8-279e6d3b9705'; // Replace with your Helius API key
const signature = '671V6MyfzJB7TmGjHrmD8zzE2GWpCEit9F32ReURyvTEtyFQ7m1dVXF32NACbLW25hSepYXwLvrSgosbKND5C8dq';

const url = `https://api.helius.xyz/v0/transactions/?api-key=${apiKey}`;
let keye = ''
const SOLANA_RPC_URL = 'https://rpc.shyft.to?api_key=pZ2l4uDcSENiYN1V'; // Change for devnet/testnet
//const SOLANA_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=940baa07-0edd-4f6c-90ef-1dcfac045b1c'; // Change for devnet/testnet
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const connection_ = new Connection('https://mainnet.helius-rpc.com/?api-key=940baa07-0edd-4f6c-90ef-1dcfac045b1c','confirmed')
//const connection_ = new Connection('https://rpc.shyft.to?api_key=pZ2l4uDcSENiYN1V','confirmed')
const Client = grpcClient.default; 
const CommitmentLevel = grpcClient.CommitmentLevel;
const client = new Client(
    "https://grpc.ny.shyft.to", //Your Region specific Shyft gRPC URL
    "36e2e19a-83fd-41d5-b883-cd248454b0b6", //Shyft gRPC Access Token
    undefined,
  );
  const transactions = [];
  const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const url = `https://api.helius.xyz/v0/transactions/?api-key=d9d1bbd0-bc01-4388-acc8-279e6d3b9705`;
  let tokenmints = []

const expectedTypes = {
    wallet:'string',
    buy_percentage: 'int',
    max_buy: 'int',
    total_investment: 'int',
    buy_times: 'int',
    auto_sells: 'boolean',
    reset_buy_times: 'boolean',
    auto_retry: 'int',
    buy_gas_fee: 'float',
    sell_gas_fee: 'float',
    buy_slippage: 'int',
    sell_slippage: 'int',
    take_profit: 'int',
    stop_loss: 'int',
  };
let keys = []
const settingKeys = [
    'wallet',
  'buy_percentage',
  'max_buy',
  'total_investment',
  'buy_times',
  'auto_sells',
  'reset_buy_times',
  'auto_retry',
  'buy_gas_fee',
  'sell_gas_fee',
  'buy_slippage',
  'sell_slippage',
  'take_profit',
  'stop_loss'
];
let wallet_snipped = []
let wallet_snipped_only = []



// Helper function to validate input
function isValidInput(key, value) {
  const type = expectedTypes[key];
  if (type === 'int') return /^\d+$/.test(value); // Only digits allowed
  if (type === 'float') return /^\d+(\.\d+)?$/.test(value); // Digits with optional decimal
  if (type === 'boolean') return ['true', 'false'].includes(value.toLowerCase());
  return false; // Default case (should never happen)
}
// Function to generate a new Solana wallet
function generateWallet() {
  const keyPair = web3.Keypair.generate();
  return {
      publicKey: keyPair.publicKey.toBase58(),
      privateKey: Buffer.from(keyPair.secretKey).toString('hex')
  };
}
// Function to check the balance of a Solana wallet
async function checkBalance(walletAddress) {
  const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
  try {
      const balance = await connection.getBalance(new web3.PublicKey(walletAddress));
      return balance / web3.LAMPORTS_PER_SOL; // Convert lamports to SOL
  } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
  }
}
function readJsonFile(filePath) {
  try {
      if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(fileContent);
      } else {
          return null;
      }
  } catch (error) {
      console.error('❌ Error reading JSON file:', error);
      return {};
  }
}

// Function to save new setting value
function saveSetting(filePath, username, key, value) {
  try {
      let jsonData = readJsonFile(filePath);
      if (!jsonData[username]) {
          jsonData[username] = {}; // Initialize settings if not present
      }
      jsonData[username][key] = value; // Update setting value
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log(`✅ ${key} updated to ${value}`);
  } catch (error) {
      console.error('❌ Error updating setting:', error);
  }
}

// Function to append a new wallet to the JSON file
function appendToJsonFile(filePath, username, newData) {
  try {
      let jsonData = readJsonFile(filePath);

      if (!jsonData[username]) {
          jsonData[username] = []; // Initialize an empty array for the user
      }

      jsonData[username].push(newData); // Append new wallet to user's array

      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log('✅ Wallet successfully appended to JSON file.');
  } catch (error) {
      console.error('❌ Error appending to JSON file:', error);
  }
}
function appendToJsonFile_simple(filePath, username, newData) {
try {
    let jsonData = readJsonFile(filePath);

    if (!jsonData[username]) {
        jsonData[username] = {}; // Initialize an empty array for the user
    }

    jsonData[username] = newData; // Append new wallet to user's array

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('✅ Wallet successfully appended to JSON file.');
} catch (error) {
    console.error('❌ Error appending to JSON file:', error);
}
}
function writeJsonFile(filePath, data) {
try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
} catch (error) {
    console.error('❌ Error writing JSON file:', error);
}
}
// const bs58 = require('bs58')
async function encodeBase58(buffer) {
    let num = BigInt("0x" + buffer.toString("hex")); // Convert buffer to a big number
    let base58 = "";
  
    while (num > 0) {
      const remainder = Number(num % BigInt(58)); // Get remainder when dividing by 58
      num = num / BigInt(58); // Reduce the number
      base58 = BASE58_ALPHABET[remainder] + base58; // Append character
    }
  
    // Handle leading zeros in the original buffer
    for (let byte of buffer) {
      if (byte === 0) {
        base58 = BASE58_ALPHABET[0] + base58;
      } else {
        break;
      }
    }
  
    return base58;
  }

function hexToByteArray(hex) {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  let byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    byteArray[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return byteArray;
}
async function buyToken(privateKeyHex, TokenMint, Amount, Gas) {
  // Convert HEX private key to Uint8Array
  console.log(`privateKey is ******************** ${privateKeyHex}`)
  const secretKeyArray = hexToByteArray(privateKeyHex);
  const keypair = Keypair.fromSecretKey(secretKeyArray);

  // const connection = new Connection("https://rpc.shyft.to?api_key=pZ2l4uDcSENiYN1V");
  const solanaTracker = new SolanaTracker(keypair, connection_.rpcEndpoint);

  // Fetch latest blockhash to prevent expired blockhash errors
  const latestBlockhash = await connection_.getLatestBlockhash();
  
  const swapResponse = await solanaTracker.getSwapInstructions(
      "So11111111111111111111111111111111111111112",// From Token (SOL)
    TokenMint,
   
    Amount, // Amount to swap
    30, // Slippage
    keypair.publicKey.toBase58(), // Payer public key
    Gas, // Priority fee
  );

  try {
    const txid = await solanaTracker.performSwap(swapResponse, {
  sendOptions: { 
    skipPreflight: true,  
    recentBlockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  },
  confirmationRetries: 1,  
  confirmationRetryTimeout: 250,  
  lastValidBlockHeightBuffer: 20,  
  resendInterval: 500,  
  confirmationCheckInterval: 500,  
  commitment: "processed",  
  skipConfirmationCheck: true,  
});

    console.log("Transaction ID:", txid);
    console.log("Transaction URL:", `https://solscan.io/tx/${txid}`);
    return true
   
  } catch (error) {
    
    console.error("Error performing swap:", error.message);
    return false
  }
}
async function sellToken(privateKeyHex, TokenMint, Amount, Gas) {
  // Convert HEX private key to Uint8Array
  const secretKeyArray = hexToByteArray(privateKeyHex);
  const keypair = Keypair.fromSecretKey(secretKeyArray);

  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=d9d1bbd0-bc01-4388-acc8-279e6d3b9705");
  const solanaTracker = new SolanaTracker(keypair, connection.rpcEndpoint);

  // Fetch latest blockhash to prevent expired blockhash errors
  const latestBlockhash = await connection.getLatestBlockhash();
  
  const swapResponse = await solanaTracker.getSwapInstructions(
    TokenMint,
    "So11111111111111111111111111111111111111112",// From Token (SOL)
    Amount, // Amount to swap
    30, // Slippage
    keypair.publicKey.toBase58(), // Payer public key
    Gas, // Priority fee
  );

  try {
    const priorityFee = 200000; // Set priority fee for ultra-fast execution

const txid = await solanaTracker.performSwap(swapResponse, {
  sendOptions: { 
    skipPreflight: true,  
    recentBlockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  },
  priorityFee,  
  confirmationRetries: 1,  
  confirmationRetryTimeout: 250,  
  lastValidBlockHeightBuffer: 20,  
  resendInterval: 500,  
  confirmationCheckInterval: 500,  
  commitment: "confirmed",  // or "finalized" if Solscan is slow
  skipConfirmationCheck: true,  
});

    return true
    console.log("Transaction ID:", txid);
    console.log("Transaction URL:", `https://solscan.io/tx/${txid}`);
  } catch (error) {
    
    console.error("Error performing swap:", error.message);
    return false
  }
}const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseTransaction = async (signature) => {
  try {
    let data = [];
    while (!data || data.length === 0) {
      await delay(100); // Adding 1-second delay before retrying
      const response = await axios.post(
        url,
        { transactions: [signature] },
        { headers: { 'Content-Type': 'application/json' } }
      );
      data = response.data;
    }

    data.forEach((transaction) => {
      const feePayer = transaction.feePayer;
      let solSpent = 0;
      let feeAmount = transaction.fee / 1_000_000_000;

      if (transaction.nativeTransfers?.length > 0) {
        transaction.nativeTransfers.forEach((transfer) => {
          if (transfer.fromUserAccount === feePayer) {
            solSpent += transfer.amount / 1_000_000_000;
          }
        });
      }

      let wsolSpent = 0;
      if (transaction.tokenTransfers?.length > 0) {
        transaction.tokenTransfers.forEach((transfer) => {
          if (
            transfer.fromUserAccount === feePayer &&
            transfer.mint === "So11111111111111111111111111111111111111112"
          ) {
            wsolSpent += transfer.tokenAmount;
          }
        });
      }

      solSpent += wsolSpent;
      console.log(`Raw SOL Spent (before fee subtraction): ${solSpent}`);
      console.log(`Transaction Fee: ${feeAmount}`);
      solSpent = Math.max(0, solSpent - feeAmount);
      console.log(`Final SOL Spent (after fee subtraction): ${solSpent}`);

      if (transaction.tokenTransfers?.length > 0) {
        transaction.tokenTransfers.forEach((transfer) => {
          if (transfer.mint === "So11111111111111111111111111111111111111112") {
            return;
          }

          let tradeType = "Unknown";
          let amountSpent = transfer.tokenAmount;

          if (transfer.fromUserAccount === feePayer) {
            tradeType = "Sell";
          } else if (transfer.toUserAccount === feePayer) {
            tradeType = "Buy";
            amountSpent = solSpent;
          }

          console.log(`Token Mint Address: ${transfer.mint}`);
          console.log(`Amount Spent: ${amountSpent.toFixed(8)}`);
          console.log(`Trade Type: ${tradeType}`);
          
          return {
            token: transfer.mint,
            amount: amountSpent.toFixed(6),
            tradeType: tradeType,
          };
        });
      } else {
        console.log("No token transfers found in this transaction.");
      }
    });
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.statusText : error.message
    );
  }
};

async function fetchTokenPrice(tokenMintAddress) {
  let price = null;

  // 1st Attempt: Fetch from DEX Screener API
  try {
      const dexScreenerURL = `https://api.dexscreener.com/latest/dex/tokens/${tokenMintAddress}`;
      const dexResponse = await axios.get(dexScreenerURL);
      
      if (dexResponse.data && dexResponse.data.pairs && dexResponse.data.pairs.length > 0) {
          price = parseFloat(dexResponse.data.pairs[0].priceUsd); // USD price
          console.log(`✅ Found price from DEX Screener: $${price}`);
          return price;
      }
  } catch (error) {
      console.error("❌ DEX Screener API failed:", error.message);
  }

  // 2nd Attempt: Fetch from CoinGecko API
  try {
      const coingeckoURL = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenMintAddress}&vs_currencies=usd`;
      const coingeckoResponse = await axios.get(coingeckoURL);
      
      if (coingeckoResponse.data[tokenMintAddress.toLowerCase()]) {
          price = parseFloat(coingeckoResponse.data[tokenMintAddress.toLowerCase()].usd);
          console.log(`✅ Found price from CoinGecko: $${price}`);
          return price;
      }
  } catch (error) {
      console.error("❌ CoinGecko API failed:", error.message);
  }

  // 3rd Attempt: Fetch from Raydium API
  try {
      const raydiumURL = `https://api.raydium.io/v2/sdk/token/${tokenMintAddress}`;
      const raydiumResponse = await axios.get(raydiumURL);
      
      if (raydiumResponse.data && raydiumResponse.data.price) {
          price = parseFloat(raydiumResponse.data.price);
          console.log(`✅ Found price from Raydium: $${price}`);
          return price;
      }
  } catch (error) {
      console.error("❌ Raydium API failed:", error.message);
  }

  console.log("⚠️ Unable to fetch token price from any source.");
  return null; // Return null if all APIs fail
}
const { performance } = require('perf_hooks');
// Async function to subscribe to real-time transactions
async function subscribeToTransactions(account, username) {
    try {
      console.log(account,username)
      console.log('hey man')
      // Create the subscription stream
      const stream = await client.subscribe();
      
      // Define the subscription request
      const req = {
        accounts: {},
        slots: {},
        transactions: {
          raydiumPoolv4: {
            vote: false,
            failed: false,
            signature: undefined,
            accountInclude: account,
            accountExclude: [],
            accountRequired: [],
          },
        },
        transactionsStatus: {},
        entry: {},
        blocks: {},
        blocksMeta: {},
        accountsDataSlice: [],
        ping: undefined,
        commitment: CommitmentLevel.CONFIRMED, // Get confirmed transactions
      };
  console.log(req)
      // Send the subscription request
      await stream.write(req);
      console.log('successfully sent request!')
      // Listen for incoming data
      stream.on("data",async (transactionUpdate) => {
        // console.log(transactionUpdate)
        const startencoding = performance.now(); // Start parsing timer
        if(transactionUpdate.transaction != undefined){
        const signature = await encodeBase58(transactionUpdate.transaction.transaction.signature);
            console.log(signature)
        const endencoding = performance.now(); // Start parsing timer
        console.log(`Encoding Time: ${(endencoding - startencoding).toFixed(2)} ms`);
        const startParsing = performance.now(); // Start parsing timer

        // console.log(signature)
        const parsed_transaction = await parseTransaction(signature)
        // const parsed_transaction = await extractTokenTradeInfo(signature, account[0]);
        const endParsing = performance.now(); // End parsing timer

        console.log(`&&&&&&&&&&&&&&&&&&&&&&&&&& ${parsed_transaction}`)
        console.log(`Parsing Time: ${(endParsing - startParsing).toFixed(2)} ms`);
          const fucktime = performance.now()
        const user = readJsonFile('setting.json')
        const wallet = user[username].wallet
        
        const users_ = readJsonFile('wallet.json')
        const wallet_ = users_[username].find(
          (entry) => entry.publicKey === wallet
        );
        const buy_gas_fee = user[username].buy_gas_fee
        const sell_gas_fee = user[username].sell_gas_fee
        const calculatedAmount = (user[username].buy_percentage / 100) * parsed_transaction.amount;
        const amount = calculatedAmount < user[username].max_buy ? calculatedAmount : user[username].max_buy;

        const privateKey =wallet_.privateKey
        const fucktime_ = performance.now()
        console.log(`fuck Time: ${(fucktime_ - fucktime).toFixed(2)} ms`);

        // console.log(parsed_transaction)
        if(parsed_transaction.tradeType == 'Buy'){
            // console.log('buying it babdy')
            const buyTime = performance.now()
            const sucess = await buyToken(privateKey , parsed_transaction.token , amount , buy_gas_fee)
            const buyTime_ = performance.now()
            console.log(`Buy Time : ${(buyTime_-buyTime).toFixed(2)} ms.`)
            if(sucess == true){
            const data = {
              'privateKey':privateKey,
              'token':parsed_transaction.token
            }
            const price = await fetchTokenPrice(parsed_transaction.token)
            tokenmints.push(data)
            const data_={
              'token':parsed_transaction.token,
              'amount':amount,
              'status':'BUY',
              'CurrentPrice':price
            }
          appendToJsonFile('open_trade.json',username,data_)
          }
        }else {
          const ___ = tokenmints.find(
              (entry) => entry.token === parsed_transaction.token && entry.privateKey === privateKey
          );
      
          const f_ = user[username].auto_sells;
      
          if (___ && f_ === "True") {

              const success = await sellToken(privateKey, parsed_transaction.token, amount, sell_gas_fee);
              
              if (success === true) {
                  const price = await fetchTokenPrice(parsed_transaction.token);
                  const userfile = readJsonFile('open_trade.json');
      
                  let entryPrice;
                  let updatedTrades = [];
      
                  if (userfile[username]) {
                      userfile[username].forEach((entry) => {
                          if (entry.token === parsed_transaction.token) {
                              entryPrice = entry.CurrentPrice; // Get the entry price
                          } else {
                              updatedTrades.push(entry); // Keep other trades
                          }
                      });
                  }
      
                  if (entryPrice !== undefined) {
                      const profit = ((price - entryPrice) / entryPrice) * 100;
      
                      const data__ = {
                          'token': parsed_transaction.token,
                          'amount': amount,
                          'closedOn': price,
                          'profitOrLoss': profit.toFixed(2) + "%"
                      };
      
                      // Append to closed_trade.json
                      appendToJsonFile('closed_trade.json', username, data__);
      
                      // Update open_trade.json without the sold token
                      userfile[username] = updatedTrades;
                      fs.writeFileSync('open_trade.json', JSON.stringify(userfile, null, 2), 'utf8');
                  }
              }
          }
      }
      
        console.log("Transaction Signature:", signature);

    }});
    
      // Handle stream errors
      stream.on("error", (err) => {
        console.error("Stream error:", err);
      });
    } catch (error) {
      console.error("Error subscribing to transactions:", error);
    }
  }












bot.start((ctx) => {
    ctx.reply(
        'Welcome to the Trading Bot! Choose an option:',
        Markup.inlineKeyboard([
            [Markup.button.callback('💼 Create Wallet', 'create_wallet')],
            [Markup.button.callback('🗑 Delete Wallet', 'delete_wallet')],
            [Markup.button.callback('👛 View Wallet', 'view_wallet')],
            [Markup.button.callback('📈 Copytrading', 'copytrading')],
            [Markup.button.callback('📊 Open Trades', 'open_trades')],
            [Markup.button.callback('📉 Previous Trades', 'previous_trades')],
        ])
    );
});

bot.action('create_wallet', async(ctx) =>{
    const username = ctx.from.username || ctx.from.id.toString();
    let newWallet = generateWallet();

    // Check balance
    let balance = await checkBalance(newWallet.publicKey);

    // Append wallet data
    appendToJsonFile('wallet.json', username, newWallet);

    ctx.reply(
        `✅ *New Wallet Created!* ✅\n\n`
        + `🔹 *Public Key:* \`${newWallet.publicKey}\`\n`
        + `🔹 *Balance:* ${balance} SOL\n\n`,
        { parse_mode: 'Markdown' }
    );
})
bot.action('view_wallet', async (ctx) => {
  const username = ctx.from.username;
  const wallets = readJsonFile('wallet.json');

  if (!wallets[username] || wallets[username].length === 0) {
    return ctx.reply('❌ *No wallets found for your account.*', { parse_mode: 'Markdown' });
  }

  let message = `📂 *Your Wallets:* \n\n`;

  // Use a for...of loop instead of forEach to handle async/await properly
  for (let index = 0; index < wallets[username].length; index++) {
    const wallet = wallets[username][index];
    const bal = await checkBalance(wallet.publicKey);  // Await the balance retrieval

    message += `🟢 *Wallet ${index + 1}*\n`;
    message += `📌 *Public Key:* \n\` ${wallet.publicKey} \`\n`;
    message += `🔑 *Private Key:* \n\` ${wallet.privateKey} \`\n`;
    message += `🔹 *Balance:*\n ${bal} SOL\n\n`;
    message += `════════════════════════════\n\n`; // Stylish separator
  }

  // Send the entire message after the loop finishes
  ctx.reply(message, { parse_mode: 'Markdown' });
});


bot.action('copytrading', (ctx) => {
    ctx.reply(
        '📈 Copy Trading Menu. Choose an option:',
        Markup.inlineKeyboard([
            [Markup.button.callback('➕ Add Wallet', 'add_wallet')],
            [Markup.button.callback('🗑 Delete Wallet', 'delete_wallet_')],
            [Markup.button.callback('🧺 View Wallets', 'view_wallets_')],
            [Markup.button.callback('🔵 Sell Position', 'sell_position')],
            [Markup.button.callback('⚙️ Settings', 'settings')],
            [Markup.button.callback('⬅️ Back to Main Menu', 'main_menu')],
        ])
    );
});
// bot.action('sell_position', async (ctx) => {
//   const username = ctx.from.username;
//   const walletsData = readJsonFile('copytrade_wallet.json');

//   if (!walletsData[username] || walletsData[username].length === 0) {
//       return ctx.reply('⚠️ *No tokens found in your wallet!* \n\n📌 You have no tokens available for selling.', { parse_mode: 'Markdown' });
//   }

//   // Extract unique publicKeys from the user's wallet
//   const uniqueTokens = [...new Set(walletsData[username].map(entry => entry.publicKey))];

//   // Create inline buttons for each token
//   const buttons = uniqueTokens.map(token => Markup.button.callback(token, `sell_token_${token}`));

//   await ctx.reply('📢 *Select the token you want to sell:*', { 
//     parse_mode: 'Markdown',
//     ...Markup.inlineKeyboard(buttons, { columns: 1 })
//   });
  
// });


bot.action('add_wallet', async (ctx) => {
    await ctx.reply("📝 *Enter your wallet address:*", { parse_mode: 'Markdown' });
    keye = 'fuck'
    
});
bot.action('view_wallets_', async (ctx) => {
  const username = ctx.from.username;
  const wallets = readJsonFile('copytrade_wallet.json');

  if (!wallets[username] || wallets[username].length === 0) {
    return ctx.reply('❌ *No wallets found for your account.*', { parse_mode: 'Markdown' });
  }

  let message = `📂 *Wallets:* \n\n`;

  // Use a for...of loop instead of forEach to handle async/await properly
  for (let index = 0; index < wallets[username].length; index++) {
    const wallet = wallets[username][index];
    // const bal = await checkBalance(wallet.publicKey);  // Await the balance retrieval

    message += `🟢 *Wallet ${index + 1}*\n`;
    message += `📌 *Public Key:* \n\` ${wallet.publicKey} \`\n`;
  //   message += `🔑 *Private Key:* \n\` ${wallet.privateKey} \`\n`;
  //   message += `🔹 *Balance:*\n ${bal} SOL\n\n`;
    message += `════════════════════════════\n\n`; // Stylish separator
  }

  // Send the entire message after the loop finishes
  ctx.reply(message, { parse_mode: 'Markdown' });
});
bot.action('delete_wallet_', (ctx) => {
    const username = ctx.from.username;
    const wallets = readJsonFile('copytrade_wallet.json');
  
    if (!wallets[username] || wallets[username].length === 0) {
        return ctx.reply('❌ *No wallets found for your account.*', { parse_mode: 'Markdown' });
    }
  console.log(wallets)
    const buttons = wallets[username].map((wallet, index) =>
        // console.log(wallets,index)
        Markup.button.callback(`🗑 ${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`, `delete_wallet__${index}`)
    );
  
    ctx.reply('📌 *Select the wallet to delete:*', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
    });
  });
// Handle "Delete Wallet" button press
bot.action('delete_wallet', (ctx) => {
  const username = ctx.from.username;
  const wallets = readJsonFile('wallet.json');

  if (!wallets[username] || wallets[username].length === 0) {
      return ctx.reply('❌ *No wallets found for your account.*', { parse_mode: 'Markdown' });
  }

  const buttons = wallets[username].map((wallet, index) =>
      Markup.button.callback(`🗑 ${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`, `delete_wallet_${index}`)
  );

  ctx.reply('📌 *Select the wallet to delete:*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
  });
});

// Handle "Open Trades" button press
bot.action('open_trades', async (ctx) => {
  const username = ctx.from.username;
  const openTrades = readJsonFile('open_trade.json');

  if (!openTrades[username] || openTrades[username].length === 0) {
      return ctx.reply('⚠️ *No active trades found!* \n\n📌 You haven’t executed any trades yet.', { parse_mode: 'Markdown' });
  }

  let message = `📊 *Your Open Trades:*\n\n`;

  for (const [index, trade] of openTrades[username].entries()) {
      const CurrentPrice_ = await fetchTokenPrice(trade.token); // Ensure this awaits properly
      const profit = ((CurrentPrice_ - trade.CurrentPrice) / trade.CurrentPrice) * 100;

      message += `*Trade ${index + 1}*\n`;
      message += `📈 *Token:* ${trade.token}\n`;
      message += `💰 *Amount:* ${trade.amount}\n`;
      message += `🔄 *Status:* ${trade.status}\n`;
      message += `💹 *Profit and Loss:* ${profit.toFixed(2)} %\n`;
      message += `---------------------------\n`;
  }

  await ctx.reply(message, { parse_mode: 'Markdown' });
});


// Handle "Previous Trades" button press
bot.action('previous_trades', (ctx) => {
  const username = ctx.from.username;
  const closedTrades = readJsonFile('closed_trade.json');

  if (!closedTrades[username] || closedTrades[username].length === 0) {
      return ctx.reply('⏳ *No previous trades found!* \n\n📌 Your trade history is empty.', { parse_mode: 'Markdown' });
  }

  let message = `📉 *Your Trade History:*\n\n`;
  closedTrades[username].forEach((trade, index) => {
    message += ` *Trade* ${index +1}`;
      message += `📈 *Token:* ${trade.token}\n`;
      message += `💰 *Amount:* ${trade.amount}\n`;
      message += `📅 *Closed On:* ${trade.closedOn}\n`;
      message += `✅ *Profit/Loss:* ${trade.profitOrLoss}\n`;
      message += `---------------------------\n`;
  });

  ctx.reply(message, { parse_mode: 'Markdown' });
});

bot.action('main_menu', (ctx) => {
    ctx.reply(
        'Welcome back to the Trading Bot! Choose an option:',
        Markup.inlineKeyboard([
            [Markup.button.callback('💼 Create Wallet', 'create_wallet')],
            [Markup.button.callback('🗑 Delete Wallet', 'delete_wallet')],
            [Markup.button.callback('👛 View Wallet', 'view_wallet')],
            [Markup.button.callback('📈 Copytrading', 'copytrading')],
            [Markup.button.callback('📊 Open Trades', 'open_trades')],
            [Markup.button.callback('📉 Previous Trades', 'previous_trades')],
        ])
    );
});

bot.action('settings', (ctx) => {
  const username = ctx.from.username;
  let userSettings= readJsonFile('setting.json')[username]
  // let userSettings
  
  if(userSettings == null){
    userSettings =  {
      wallet : 'Your Wallet',
      buy_percentage: '10',
      max_buy: '0.5',
      total_investment: '10',
      buy_times: '1',
      auto_sells: 'True',
      reset_buy_times: 'True',
      auto_retry: '1',
      buy_gas_fee: '0.001',
      sell_gas_fee: '0.001',
      buy_slippage: '30',
      sell_slippage: '30',
      take_profit: '40',
      stop_loss: '20',
  };
  appendToJsonFile_simple('setting.json',username , userSettings)
  }

  ctx.reply(
      '⚙️ *Copy Trading Settings*\n\n' +
      'Click on a value to modify it.',
      Markup.inlineKeyboard([[Markup.button.callback('Your Wallet', 'wallet_label'), Markup.button.callback(`${userSettings.wallet}`, 'wallet')],
          [Markup.button.callback('Buy Percentage', 'buy_percentage_label'), Markup.button.callback(`${userSettings.buy_percentage} %`, 'buy_percentage')],
          [Markup.button.callback('Max Buy', 'max_buy_label'), Markup.button.callback(`${userSettings.max_buy} SOL`, 'max_buy')],
          [Markup.button.callback('Total Investment', 'total_investment_label'), Markup.button.callback(`${userSettings.total_investment} SOL`, 'total_investment')],
          [Markup.button.callback('Each Token Buy Times', 'buy_times_label'), Markup.button.callback(`${userSettings.buy_times}`, 'buy_times')],
          [Markup.button.callback('Copy Auto Sells', 'auto_sells_label'), Markup.button.callback(`${userSettings.auto_sells}`, 'auto_sells')],
          [Markup.button.callback('Buy Times Reset After Sell', 'reset_buy_times_label'), Markup.button.callback(`${userSettings.reset_buy_times}`, 'reset_buy_times')],
          [Markup.button.callback('Auto Retry Buy/Sell', 'auto_retry_label'), Markup.button.callback(`${userSettings.auto_retry} times`, 'auto_retry')],
          [Markup.button.callback('Buy Gas Fee', 'buy_gas_fee_label'), Markup.button.callback(`${userSettings.buy_gas_fee} SOL`, 'buy_gas_fee')],
          [Markup.button.callback('Sell Gas Fee', 'sell_gas_fee_label'), Markup.button.callback(`${userSettings.sell_gas_fee} SOL`, 'sell_gas_fee')],
          [Markup.button.callback('Buy Slippage', 'buy_slippage_label'), Markup.button.callback(`${userSettings.buy_slippage} %`, 'buy_slippage')],
          [Markup.button.callback('Sell Slippage', 'sell_slippage_label'), Markup.button.callback(`${userSettings.sell_slippage} %`, 'sell_slippage')],
          [Markup.button.callback('Take Profit', 'take_profit_label'), Markup.button.callback(`TP ${userSettings.take_profit} %`, 'take_profit')],
          [Markup.button.callback('Stop Loss', 'stop_loss_label'), Markup.button.callback(`SL ${userSettings.stop_loss} %`, 'stop_loss')],
          [Markup.button.callback('⬅️ Back to Copy Trading Menu', 'copytrading')]
      ]).resize()
  );
});
settingKeys.forEach((key) => {
  bot.action(key, (ctx) => {
    console.log(key)
      ctx.reply(`✏️ Enter a new value for *${key.replace('_', ' ')}*:`, { parse_mode: 'Markdown' });
      keys.push(key)
    
  });
});
bot.action(/delete_wallet__(\d+)/, (ctx) => {
    const username = ctx.from.username;
    const wallets = readJsonFile('copytrade_wallet.json');
    const walletIndex = parseInt(ctx.match[1], 10);
  
    if (!wallets[username] || walletIndex >= wallets[username].length) {
        return ctx.reply('⚠️ Invalid wallet selection.');
    }
  
    const deletedWallet = wallets[username].splice(walletIndex, 1);
    writeJsonFile('copytrade_wallet.json', wallets);
  
    ctx.reply(`✅ *Wallet Deleted Successfully!* \n\n🔑 *Public Key:* \n\`${deletedWallet[0].publicKey}\``, {
        parse_mode: 'Markdown',
    });
  });
bot.action(/delete_wallet_(\d+)/, (ctx) => {
    const username = ctx.from.username;
    const wallets = readJsonFile('wallet.json');
    const walletIndex = parseInt(ctx.match[1], 10);
  
    if (!wallets[username] || walletIndex >= wallets[username].length) {
        return ctx.reply('⚠️ Invalid wallet selection.');
    }
  
    const deletedWallet = wallets[username].splice(walletIndex, 1);
    writeJsonFile('wallet.json', wallets);
  
    ctx.reply(`✅ *Wallet Deleted Successfully!* \n\n🔑 *Public Key:* \n\`${deletedWallet[0].publicKey}\``, {
        parse_mode: 'Markdown',
    });
  });
  bot.on('text', async(ctx) => {
    if(keye == 'fuck'){
      const username = ctx.from.username;
      console.log('no')
      const wallet = ctx.message.text.trim();

      if (!wallet) {
          return ctx.reply("⚠️ Invalid input. Please enter a valid wallet address.");
      }
     
      const user = readJsonFile('setting.json')
      // console.log(user[username].wallet)
      if(user[username].wallet == "Your Wallet" || user[username].wallet == undefined){
          return ctx.reply('Please add your wallet first in the settings ')
      }
      const data = {
          'publicKey':wallet,
          'wallet':user[username].wallet
      }
      wallet_snipped.push(data)
      wallet_snipped_only.push(wallet)
      console.log('sending ee')
      subscribeToTransactions(wallet_snipped_only,username);



      appendToJsonFile('copytrade_wallet.json', username, data);

      await ctx.reply('✅ Wallet Added Successfully!');

      // // Refresh the Copy Trading Menu
      // ctx.deleteMessage(); // Delete old message for clean UI
      // bot.action('copytrading')(ctx); // Call copy trading menu again
  }
    if(keye != 'fuck'){
      const username = ctx.from.username;
      const newValue = ctx.message.text.trim();
      const key = keys[keys.length - 1];
      if(key == 'wallet'){
        console.log(key)
        saveSetting('setting.json', username, key, newValue);

        ctx.reply(`✅ *${key.replace('_', ' ')}* updated to *${newValue}*!`, { parse_mode: 'Markdown' });

        // Refresh the settings menu after update
        bot.action('settings', (ctx));
      } // Output: 40
     else if (!isValidInput(key, newValue)) {
        return ctx.reply(
          `❌ *Invalid Input!*\n\n🔹 *${key.replace('_', ' ')}* must be of type *${expectedTypes[key]}*.\n\n` +
          `📌 Example: ${expectedTypes[key] === 'int' ? '5' : expectedTypes[key] === 'float' ? '10.5' : 'true/false'}`,
          { parse_mode: 'Markdown' }
        );
      }
else{

      console.log(key)
      saveSetting('setting.json', username, key, newValue);

      ctx.reply(`✅ *${key.replace('_', ' ')}* updated to *${newValue}*!`, { parse_mode: 'Markdown' });

      // Refresh the settings menu after update
      bot.action('settings', (ctx));
}}});
// bot.on('callback_query', async (ctx) => {
//   const username = ctx.from.username;
//   const walletsData = readJsonFile('copytrade_wallet.json');
//   const callbackData = ctx.callbackQuery.data;

//   if (callbackData.startsWith('sell_token_')) {
//       const selectedToken = callbackData.replace('sell_token_', ''); // Extract token

//       // Find the corresponding wallet for the selected token
//       const userWallets = walletsData[username].filter(entry => entry.publicKey === selectedToken);
//       if (userWallets.length === 0) {
//           return ctx.reply('⚠️ *No wallet found for this token!*');
//       }

//       const wallet = userWallets[1].wallet; // Assuming the first wallet is used

//       await ctx.reply(`✅ *You selected:* ${selectedToken}\n💼 *Corresponding Wallet:* ${wallet}`);
      
//       // Proceed with the sell process
//   }
// });
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
