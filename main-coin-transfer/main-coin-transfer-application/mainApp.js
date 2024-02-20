'use strict';

const { TextDecoder } = require("util");

class MainApp {
    /*
    * Main application functions that interact with main chaincode.
    * */
    constructor() {
        this.utf8Decoder = new TextDecoder();
    }

    async readWallet(contract, id) {
        try {
            const walletBinary = await (await contract).evaluateTransaction("ReadWallet", id);
            const walletString = this.utf8Decoder.decode(walletBinary);
            return JSON.parse(walletString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async getAllWallets(contract) {
        try {
            const walletsBinary = await (await contract).evaluateTransaction("GetAllWallets");
            const walletsString = this.utf8Decoder.decode(walletsBinary);
            return JSON.parse(walletsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }
}

module.exports = {
    MainApp
}