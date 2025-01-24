const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const targetWallet = 'YOUR_TARGET_WALLET_ADDRESS';
const grpcUrl = 'grpc.ny.shyft.to';  // Ensure this is the correct endpoint

// Load the .proto definition
const packageDefinition = protoLoader.loadSync('shyft.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const shyftProto = grpc.loadPackageDefinition(packageDefinition);
const client = new shyftProto.TransactionService(grpcUrl, grpc.credentials.createInsecure());

// Function to listen to transactions
function monitorTransactions() {
    const stream = client.SubscribeToTransactions({ wallet: targetWallet });

    stream.on('data', (tx) => {
        console.log('New Transaction:', tx);
    });

    stream.on('error', (err) => {
        console.error('Error:', err);
    });

    stream.on('end', () => {
        console.log('Stream ended');
    });
}

monitorTransactions();
