'use strict';

const { TextDecoder } = require("util");
const utf8Decoder = new TextDecoder();

class DemoApp {
    constructor() {}
    async initLedger(contract) {
        try {
            await (await contract).submitTransaction('initLedger');
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    async readTrx(contract, id) {
        try {
            const trxBinary = await (await contract).evaluateTransaction("ReadTrx", id);
            const trxString = utf8Decoder.decode(trxBinary);
            return JSON.parse(trxString);
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    async createWalletTrx(contract, id, walletId, name, amount) {
        try {
            await (await contract).submitTransaction("CreateWalletTrx", id, walletId, name, amount);
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    async updateWalletTrx(contract, id, walletId, name, amount) {
        try {
            await (await contract).submitTransaction("UpdateWalletTrx", id, walletId, name, amount);
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    async deleteWalletTrx(contract, id, walletId) {
        try {
            await (await contract).submitTransaction("DeleteWalletTrx", id, walletId);
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    async getAllTransactions(contract) {
        try {
            const transactionsBinary = await (await contract).evaluateTransaction("GetAllTransactions");
            const transactionsString = utf8Decoder.decode(transactionsBinary);
            return JSON.parse(transactionsString);
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    async transferCoinsTrx(contract, id, senderId, receiverId, amount) {
        try {
            await (await contract).submitTransaction("TransferCoinsTrx", id, senderId, receiverId, amount);
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    async assignTransactions(contract, minerName, count) {
        try {
            const transactionsBinary = await (await contract).submitTransaction("AssignTransactions", minerName, count);
            const transactionsString = utf8Decoder.decode(transactionsBinary);
            return JSON.parse(transactionsString);
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }
}


module.exports = {
    DemoApp
}