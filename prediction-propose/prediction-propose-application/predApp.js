'use strict';

const { TextDecoder } = require("util");
const utf8Decoder = new TextDecoder();

class PredApp {
    constructor() {}

    async initLedger(contract) {
        /*
        * Invokes the init ledger function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("InitLedger");
            return "Ledger was successfully initialized."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async readPrediction(contract, id) {
        /*
        * Invokes the read prediction function of chaincode modelCC.
        * */
        try {
            const predBinary = await (await contract).evaluateTransaction("ReadPrediction", id);
            const predString = utf8Decoder.decode(predBinary);
            return JSON.parse(predString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async createPrediction(contract, id, minerName, predictions) {
        /*
        * Invokes the create prediction function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("CreatePrediction", id, minerName, predictions);
            return "The prediction was successfully created."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async deletePrediction(contract, id) {
        /*
        * Invokes the delete prediction function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("DeletePrediction", id);
            return "Prediction was successfully deleted."
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async getAllPredictions(contract) {
        /*
        * Invokes the get all predictions function of chaincode modelCC.
        * */
        try {
            const predictionsBinary = await (await contract).evaluateTransaction("GetAllPredictions");
            const predictionsString = utf8Decoder.decode(predictionsBinary);
            return JSON.parse(predictionsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }
}

module.exports = {
    PredApp
}