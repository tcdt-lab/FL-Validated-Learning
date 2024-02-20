'use strict';

// Application functions of each chaincode
const { DemoApp } = require("../demo-coin-transfer/demo-coin-transfer-application/demoApp");
const demoApp = new DemoApp();
const { MainApp } = require("../main-coin-transfer/main-coin-transfer-application/mainApp");
const mainApp = new MainApp();
const { ModelApp } = require("../model-propose/model-propose-application/modelApp");
const modelApp = new ModelApp();

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

const mspId = "Org1MSP";

const cryptoPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com');
const keyDirPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
const certPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem');
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');

const peerEndPoint = "localhost:7051";
const peerHostAlias = "peer0.org1.example.com";

// contract for each chaincode
// const contractDemo = InitConnection("demo", "demoCC");
// const contractMain = InitConnection("main", "mainCC");
const contractModel = InitConnection("model", "modelCC");

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

async function InitConnection(channelName, chaincodeName) {
    /*
    * Returns a contract for a given channel and chaincode.
    * */
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
    res.send("Hello World! from demo.");
});

/*
* Demo application API
* */
app.post('/api/demo/ledger/', async (req, res) => {
    const message = await demoApp.initLedger(contractDemo);
    res.send(message);
});

app.get('/api/demo/transaction/', jsonParser, async (req, res) => {
   const trx = await demoApp.readTrx(contractDemo, req.body.id);
   res.send(trx);
});

app.post('/api/demo/transaction/create/', jsonParser, async (req, res) => {
   const message = await demoApp.createWalletTrx(contractDemo, req.body.id, req.body.walletId, req.body.name, req.body.amount.toString());
   res.send(message);
});

app.post('/api/demo/transaction/update/', jsonParser, async (req, res) => {
    const message = await demoApp.updateWalletTrx(contractDemo, req.body.id, req.body.walletId, req.body.name, req.body.amount.toString());
    res.send(message);
});

app.post('/api/demo/transaction/delete/', jsonParser, async (req, res) => {
    const message = await demoApp.deleteWalletTrx(contractDemo, req.body.id, req.body.walletId);
    res.send(message);
});

app.post('/api/demo/transaction/transfer/', jsonParser, async (req, res) => {
    const message = await demoApp.transferCoinsTrx(contractDemo, req.body.id, req.body.senderId, req.body.receiverId, req.body.amount.toString());
    res.send(message);
})

app.get('/api/demo/transactions/', async (req, res) => {
    const transactions = await demoApp.getAllTransactions(contractDemo);
    res.send(transactions);
});

app.post('/api/demo/transactions/assign/', jsonParser, async (req, res) => {
   const transactions = await demoApp.assignTransactions(contractDemo, req.body.minerName, req.body.count.toString());
   res.send(transactions);
});


/*
* Main application API
* */
app.get('/api/main/wallets/', jsonParser, async (req, res) => {
    const wallets = await mainApp.getAllWallets(contractMain);
    res.send(wallets);
});

app.get('/api/main/wallet/', jsonParser, async (req, res) => {
    const wallet = await mainApp.readWallet(contractMain, req.body.id);
    res.send(wallet);
});


/*
* Model application API
* */
app.post('/api/model/ledger/', async (req, res) => {
    const message = await modelApp.initLedger(contractModel);
    res.send(message);
});

app.post('/api/model/', jsonParser, async (req, res) => {
    const message = await modelApp.createModel(contractModel, req.body.id, req.body.minerName, req.body.hash, JSON.stringify(req.body.transactions))
    res.send(message);
});

app.get('/api/model/', jsonParser, async (req, res) => {
    const model = await modelApp.readModel(contractModel, req.body.id);
    res.send(model);
});

app.delete('/api/model/', jsonParser, async (req, res) => {
    const message = await modelApp.deleteModel(contractModel, req.body.id);
    res.send(message);
});

app.get('/api/models/', async (req, res) => {
    const models = await modelApp.getAllModels(contractModel);
    res.send(models);
})

app.listen(port, () => {
    console.log("Server is listening on localhost:3000.");
});