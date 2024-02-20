'use strict';

const { TextDecoder } = require("util");
const utf8Decoder = new TextDecoder();

class DemoApp {
    /*
    * Demo application functions that interact with demo chaincode.
    * */
    constructor() {}
    async initTransactions(contract) {
        try {
            await (await contract).submitTransaction('InitTransactions');
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

    async createWalletTrx(contract, walletId, amount) {
        try {
            await (await contract).submitTransaction("CreateWalletTrx", walletId, amount);
            return "'create wallet' transaction was successfully created."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async updateWalletTrx(contract, walletId, amount) {
        try {
            await (await contract).submitTransaction("UpdateWalletTrx", walletId, amount);
            return "'update wallet' transaction was successfully created."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async deleteWalletTrx(contract, walletId) {
        try {
            await (await contract).submitTransaction("DeleteWalletTrx", walletId);
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

    async transferCoinsTrx(contract, senderId, receiverId, amount) {
        try {
            await (await contract).submitTransaction("TransferCoinsTrx", senderId, receiverId, amount);
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

    async toggleAcceptingStatus(contract) {
        try {
            await (await contract).submitTransaction("ToggleAcceptingStatus");
            return "Transaction assignment and model proposal accepting status was successfully toggled."
        } catch (error) {
            console.log(error);
            return error;
        }
    }
}


module.exports = {
    DemoApp
}