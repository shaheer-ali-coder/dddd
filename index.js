const grpc = require("@grpc/grpc-js");

const GRPC_URL = "grpc.ny.shyft.to:443"; // Ensure port 443 for secure gRPC
const TARGET_WALLET = "YOUR_TARGET_WALLET_ADDRESS"; // Replace with target wallet

// Create gRPC Client
const client = new grpc.Client(GRPC_URL, grpc.credentials.createSsl());

// Function to fetch transactions for the wallet
function watchTransactions() {
    const request = { address: TARGET_WALLET }; // Request body

    client.makeUnaryRequest(
        "/shyft.v1.ShiftService/GetTransactions", // gRPC method
        JSON.stringify, // Serialize request
        JSON.parse, // Deserialize response
        request,
        (error, response) => {
            if (error) {
                console.error("Error fetching transactions:", error);
            } else {
                console.log("Transaction Data:", response);
            }
        }
    );
}

// Start monitoring transactions
watchTransactions();
