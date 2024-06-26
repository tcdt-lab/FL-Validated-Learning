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
app.use(express.json({limit: '50mb', extended: true}));
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

// deadlines for each step
const modelProposeDeadline = 180;
const predProposeDeadline = 15;
const voteAssignDeadline = 15;

// ports
let minersPorts = [8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009];
const aggregatorPort = 5050;

const winnerCount = 5;
const rounds = 20;
let current_round = 0;

let allWinners = [];

// contract for each chaincode
const contractDemo = InitConnection("demo", "demoCC");
const contractMain = InitConnection("main", "mainCC");
const contractModel = InitConnection("demo", "modelCC");
const contractPred = InitConnection("demo", "predCC");
const contractVote = InitConnection("demo", "voteCC");

// Communicating with miners
const axios = require("axios");

// Lock for preventing PHANTOM error
const { Semaphore } = require('async-mutex');
const semaphore = new Semaphore(1);

async function newGrpcConnection() {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndPoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
        'grpc.max_send_message_length' : 100 * 1024 * 1024,
        'grpc.max_receive_message_length' : 100 * 1024 * 1024
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function refreshStates(winners) {
    await demoApp.refreshTransactions(contractDemo, JSON.stringify(winners));
    console.log("Demo transactions are reset.")
    await modelApp.deleteAllModels(contractModel);
    await predApp.deleteAllPredictions(contractPred);
    await voteApp.deleteAllVotes(contractVote);
    console.log("All models, predictions, and votes are deleted.");
}

async function distributeRewards(rewards) {
    for (const data of rewards) {
        await mainApp.rewardMiner(contractMain, data['id'], data['reward']);
    }
}

async function selectWinners() {
    const winners = await voteApp.selectWinners(contractVote, winnerCount.toString());
    allWinners.push(winners)
    console.log(`Winners of the current round are : ${winners}`);
    const message = await mainApp.runWinnerTransactions(contractMain, JSON.stringify(winners));
    console.log(message);
    const models = await modelApp.getWinnerModels(contractModel, JSON.stringify(winners));
    const res = await axios({
        method: 'post',
        url: `http://localhost:${aggregatorPort}/aggregate/`,
        headers: {},
        data: {
            models: models,
        }
    });
    await distributeRewards(res.data);
    console.log("The global model is updates and rewards are distributed.");
    await refreshStates(winners);
    console.log(`*** ROUND ${current_round} COMPLETED *** \n`);
    await startRound();
}

async function gatherPredictions() {
    await predApp.toggleAcceptingStatus(contractPred);
    minersPorts = shuffleArray(minersPorts);
    for (const port of minersPorts) {
        await axios.get(`http://localhost:${port}/preds/ready/`, {
            params : {
                status : "ready",
            }
        });
    }
    console.log("Miners are notified to vote the predictions.");
    setTimeout(selectWinners, voteAssignDeadline*1000);
}

async function gatherTestData() {
    await demoApp.toggleAcceptingStatus(contractDemo);
    await predApp.toggleAcceptingStatus(contractPred);
    await modelApp.gatherAllTestRecords(contractModel);
    await modelApp.gatherAllTestRecords(contractModel);
    minersPorts = shuffleArray(minersPorts);
    for (const port of minersPorts) {
        await axios.get(`http://localhost:${port}/tests/ready/`, {
            params : {
                status : "ready",
            }
        });
    }
    console.log("Miners are notified to predict test data records.");
    setTimeout(gatherPredictions, predProposeDeadline*1000);
}

async function startRound() {
    current_round += 1;
    if (current_round <= rounds) {
        await demoApp.toggleAcceptingStatus(contractDemo);
        minersPorts = shuffleArray(minersPorts);
        for (const port of minersPorts) {
            await axios.get(`http://localhost:${port}/transactions/ready/`, {
                params: {
                    status: "ready",
                    time: modelProposeDeadline,
                    round: current_round
                }
            });
        }
        setTimeout(gatherTestData, modelProposeDeadline * 1000);
        console.log(`*** ROUND ${current_round} STARTED ***`);
        console.log("Miners are notified to gather transactions and train local models.");
    } else {
        console.log("All rounds Completed.");
        console.log("All winners are: ");
        console.log(allWinners);
        allWinners = [];
        current_round = 0;
    }
}

app.get('/', (req, res) => {
    res.send("Hello World! from demo.");
});

app.get('/exit', (req, res) => {
    process.exit();
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
    const transactions = await demoApp.assignTransactions(contractDemo, req.body.minerName, req.body.count.toString());
    res.send(transactions);
});

app.get('/api/demo/transactions/assign/', jsonParser, async (req, res) => {
    const transactions = await demoApp.getTransactionsByAssignment(contractDemo, req.body.minerName);
    res.send(transactions);
});

app.delete('/api/demo/transaction/', jsonParser, async (req, res) => {
    const message = await demoApp.deleteDemoTrx(contractDemo, req.body.id);
    res.send(message);
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

app.post('/api/main/run/', jsonParser, async (req, res) => {
    const message = await mainApp.runWinnerTransactions(contractMain, JSON.stringify(req.body.winners));
    res.send(message)
})


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

app.get('/api/model/accepting/', async (req, res) => {
    const message = await modelApp.getAcceptingStatus(contractModel);
    res.send(message)
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
    const message = await voteApp.initVotes(contractVote);
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


/* 
* Application flow
* */

app.post('/api/start/', async (req, res) => {
    // Starts the flow of the system by allowing transaction assignment and model proposal
    await startRound();
    res.send("Miners are notified to gather transactions and train local models.");
})

app.listen(port, () => {
    console.log(`Server is listening on localhost:${port}.\n`);
});