'use strict';

// Application functions of each chaincode
const { DemoApp } = require("../demo-coin-transfer/demo-coin-transfer-application/demoApp");
const demoApp = new DemoApp();
const { MainApp } = require("../main-coin-transfer/main-coin-transfer-application/mainApp");
const mainApp = new MainApp();
const { ModelApp } = require("../model-propose/model-propose-application/modelApp");
const modelApp = new ModelApp();
const { PredApp } = require("../prediction-propose/prediction-propose-application/predApp");
const predApp = new PredApp();
const { VoteApp } = require("../vote-assign/vote-assign-application/voteApp");
const voteApp = new VoteApp();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const jsonParser = bodyParser.json();
const port = 3001;

const crypto = require("crypto");
const grpc = require("@grpc/grpc-js");
const {connect, Contract, Identity, Signer, signers} = require("@hyperledger/fabric-gateway");
const fs = require("fs/promises");
const path = require("path");

const mspId = "Org2MSP";

const cryptoPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com');
const keyDirPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'keystore');
const certPath = path.resolve(cryptoPath, 'users', 'User1@org2.example.com', 'msp', 'signcerts', 'User1@org2.example.com-cert.pem');
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

const peerEndPoint = "localhost:9051";
const peerHostAlias = "peer0.org2.example.com";

// contract for each chaincode
const contractDemo = InitConnection("demo", "demoCC");
const contractMain = InitConnection("main", "mainCC");
const contractModel = InitConnection("demo", "modelCC");
const contractPred = InitConnection("demo", "predCC");
const contractVote = InitConnection("demo", "voteCC");

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
    const message = await demoApp.initTransactions(contractDemo);
    res.send(message);
});

app.get('/api/demo/transaction/', jsonParser, async (req, res) => {
   const trx = await demoApp.readTrx(contractDemo, req.body.id);
   res.send(trx);
});

app.post('/api/demo/transaction/create/', jsonParser, async (req, res) => {
   const message = await demoApp.createWalletTrx(contractDemo, req.body.walletId, req.body.amount.toString());
   res.send(message);
});

app.post('/api/demo/transaction/update/', jsonParser, async (req, res) => {
    const message = await demoApp.updateWalletTrx(contractDemo, req.body.walletId, req.body.amount.toString());
    res.send(message);
});

app.post('/api/demo/transaction/delete/', jsonParser, async (req, res) => {
    const message = await demoApp.deleteWalletTrx(contractDemo, req.body.walletId);
    res.send(message);
});

app.post('/api/demo/transaction/transfer/', jsonParser, async (req, res) => {
    const message = await demoApp.transferCoinsTrx(contractDemo, req.body.senderId, req.body.receiverId, req.body.amount.toString());
    res.send(message);
})

app.get('/api/demo/transactions/', async (req, res) => {
    const transactions = await demoApp.getAllTransactions(contractDemo);
    res.send(transactions);
});

app.post('/api/demo/transactions/assign/', jsonParser, async (req, res) => {
    // await semaphore.runExclusive(async () => {
    //     return await demoApp.assignTransactions(contractDemo, req.body.minerName, req.body.count.toString());
    // }).then((transactions) => {
    //     res.send(transactions)
    // });
    const transactions = await demoApp.assignTransactions(contractDemo, req.body.minerName, req.body.count.toString());
    res.send(transactions);
});

/*
* Main application API
* */
app.post('/api/main/ledger/', async (req, res) => {
    const message = await mainApp.initWallets(contractMain);
    res.send(message);
});

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
    const message = await modelApp.initModels(contractModel);
    res.send(message);
});

app.post('/api/model/', jsonParser, async (req, res) => {
    const message = await modelApp.createModel(contractModel, req.body.id, req.body.hash, req.body.path, JSON.stringify(req.body.transactions), JSON.stringify((req.body.testData)));
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
});

/*
* Pred application API
* */
app.post("/api/pred/ledger/", async (req, res) => {
    const message = await predApp.initPredictions(contractPred);
    res.send(message);
});

app.get("/api/preds/", async (req, res) => {
   const predictions = await predApp.getAllPredictions(contractPred);
   res.send(predictions);
});

app.get("/api/preds/miner/", jsonParser, async (req, res) => {
    const predictions = await predApp.gatherAllPredictions(contractPred, req.body.id);
    res.send(predictions);
});

app.get("/api/pred/", jsonParser, async (req, res) => {
   const pred = await predApp.readPrediction(contractPred, req.body.id);
   res.send(pred);
});

app.post("/api/pred/", jsonParser, async (req, res) => {
   const message = await predApp.createPrediction(contractPred, req.body.id, JSON.stringify(req.body.predictions));
   res.send(message);
});

app.delete("/api/pred/", jsonParser, async (req, res) => {
   const message = await predApp.deletePrediction(contractPred, req.body.id);
   res.send(message)
});


/*
* Vote application API
* */

app.post("/api/vote/ledger/", async (req, res) => {
    const message = await voteApp.initLedger(contractVote);
    res.send(message);
});

app.get("/api/votes/", async (req, res) => {
    const votes = await voteApp.getAllVotes(contractVote);
    res.send(votes);
});

app.get("/api/vote/", jsonParser, async (req, res) => {
    const vote = await voteApp.readVote(contractVote, req.body.id);
    res.send(vote);
});

app.post("/api/vote/", jsonParser, async (req, res) => {
    const message = await voteApp.createVote(contractVote, req.body.id, JSON.stringify(req.body.votes));
    res.send(message);
});

app.delete("/api/vote/", jsonParser, async (req, res) => {
    const message = await voteApp.deleteVote(contractVote, req.body.id);
    res.send(message);
});

app.listen(port, () => {
    console.log(`Server is listening on localhost:${port}.`);
});