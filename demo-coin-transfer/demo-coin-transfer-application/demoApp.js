'use strict';

const { TextDecoder } = require("util");
const utf8Decoder = new TextDecoder();

class DemoApp {
    /*
    * Demo application functions that interact with demo chaincode.
    * */
    constructor() {}
    async initLedger(contract) {
        try {
            await (await contract).submitTransaction('initLedger');
            return "Demo ledger was successfully initialized.";
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async readTrx(contract, id) {
        try {
            const trxBinary = await (await contract).evaluateTransaction("ReadTrx", id);
            const trxString = utf8Decoder.decode(trxBinary);
            return JSON.parse(trxString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async createWalletTrx(contract, id, walletId, name, amount) {
        try {
            await (await contract).submitTransaction("CreateWalletTrx", id, walletId, name, amount);
            return "'create wallet' transaction was successfully created."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async updateWalletTrx(contract, id, walletId, name, amount) {
        try {
            await (await contract).submitTransaction("UpdateWalletTrx", id, walletId, name, amount);
            return "'update wallet' transaction was successfully created."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async deleteWalletTrx(contract, id, walletId) {
        try {
            await (await contract).submitTransaction("DeleteWalletTrx", id, walletId);
            return "'delete wallet' transaction was successfully created."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async getAllTransactions(contract) {
        try {
            const transactionsBinary = await (await contract).evaluateTransaction("GetAllTransactions");
            const transactionsString = utf8Decoder.decode(transactionsBinary);
            return JSON.parse(transactionsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async transferCoinsTrx(contract, id, senderId, receiverId, amount) {
        try {
            await (await contract).submitTransaction("TransferCoinsTrx", id, senderId, receiverId, amount);
            return "'transfer' transaction was successfully created."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async assignTransactions(contract, minerName, count) {
        try {
            const transactionsBinary = await (await contract).submitTransaction("AssignTransactions", minerName, count);
            const transactionsString = utf8Decoder.decode(transactionsBinary);
            return JSON.parse(transactionsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }
}


module.exports = {
    DemoApp
}