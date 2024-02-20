'use strict';

const { DemoApp } = require("../demo-coin-transfer/demo-coin-transfer-application/demoApp")
const demoApp = new DemoApp();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const jsonParser = bodyParser.json();
const port = 3000;

const crypto = require("crypto");
const grpc = require("@grpc/grpc-js");
const {connect, Contract, Identity, Signer, signers} = require("@hyperledger/fabric-gateway");
const fs = require("fs/promises");
const path = require("path");

const channelName = "demo";
const chaincodeName = "demoCC";
const mspId = "Org1MSP";

const cryptoPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com');
const keyDirPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem');
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');

const peerEndPoint = "localhost:7051";
const peerHostAlias = "peer0.org1.example.com";

const contract = InitConnection();

async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndPoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity() {
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner() {
    const files = await fs.readdir(keyDirPath);
    const keyPath = path.resolve(keyDirPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function InitConnection() {
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 500000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 1500000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 500000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 6000000 }; // 1 minute
        },
    });

    const network = gateway.getNetwork(channelName);

    return network.getContract(chaincodeName);
}

app.get('/', (req, res) => {
    res.send("Hello World!");
});

app.post('/api/demo/ledger/', async (req, res) => {
    await demoApp.initLedger(contract);
    res.send("Demo ledger was successfully initialized.");
});

app.get('/api/demo/transaction/', jsonParser, async (req, res) => {
   const trx = await demoApp.readTrx(contract, req.body.id);
   res.send(trx);
});

app.post('/api/demo/transaction/create/', jsonParser, async (req, res) => {
   await demoApp.createWalletTrx(contract, req.body.id, req.body.walletId, req.body.name, req.body.amount);
   res.send("'create wallet' transaction was successfully created.");
});

app.post('/api/demo/transaction/update/', jsonParser, async (req, res) => {
    await demoApp.updateWalletTrx(contract, req.body.id, req.body.walletId, req.body.name, req.body.amount);
    res.send("'update wallet' transaction was successfully created.");
});

app.post('/api/demo/transaction/delete/', jsonParser, async (req, res) => {
    await demoApp.deleteWalletTrx(contract, req.body.id, req.body.walletId);
    res.send("'delete wallet' transaction was successfully created.");
});

app.post('/api/demo/transaction/transfer/', jsonParser, async (req, res) => {
    await demoApp.transferCoinsTrx(contract, req.body.id, req.body.senderId, req.body.receiverId, req.body.amount);
    res.send("'transfer' transaction was successfully created.");
})

app.get('/api/demo/transactions/', async (req, res) => {
    const transactions = await demoApp.getAllTransactions(contract);
    res.send(transactions);
});

app.post('/api/demo/transactions/assign/', jsonParser, async (req, res) => {
   const transactions = await demoApp.assignTransactions(contract, req.body.minerName, req.body.count);
   res.send(transactions);
});

app.listen(port, () => {
    console.log("Server is listening on localhost:3000.");
});