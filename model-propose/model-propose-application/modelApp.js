'use strict';

const { TextDecoder } = require("util");
const utf8decoder = new TextDecoder();

class ModelApp {
    constructor() {}

    async initModels(contract) {
        /*
        * Invokes the initial ledger function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("InitWallets");
            return "Ledger was successfully initialized.";
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async createModel(contract, id, path, minerName, hash, transactions) {
        /*
        * Invokes the create model function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("CreateModel", id, path, minerName, hash, transactions);
            return "Model was successfully created.";
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async readModel(contract, id) {
        /*
        * Invokes the read model function of chaincode modelCC.
        * */
        try {
            const modelBinary = await (await contract).evaluateTransaction("ReadModel", id);
            const modelString = utf8decoder.decode(modelBinary);
            return JSON.parse(modelString);
        } catch(error) {
            console.log(error);
            return error;
        }
    }

    async deleteModel(contract, id) {
        /*
        * Invokes the delete model function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("DeleteModel", id);
            return "Model was successfully deleted."
        } catch(error) {
            console.log(error)
            return error;
        }
    }

    async getAllModels(contract) {
        /*
        * Invokes the get all models function of chaincode modelCC.
        * */
        try {
            const modelsBinary = await (await contract).evaluateTransaction("GetAllModels");
            const modelsString = utf8decoder.decode(modelsBinary);
            return JSON.parse(modelsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async gatherAllTestRecords(contract) {
        try {
            const testRecordsBinary = await (await contract).submitTransaction("GatherAllTestRecords");
            const testRecordsString = utf8decoder.decode(testRecordsBinary);
            return JSON.parse(testRecordsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async getAcceptingStatus(contract) {
        try {
            const acceptingBinary = await (await contract).evaluateTransaction("GetAcceptingStatus");
            const acceptingString = utf8decoder.decode(acceptingBinary);
            return JSON.parse(acceptingString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async deleteAllModels(contract) {
        try {
            await (await contract).submitTransaction("DeleteAllModels");
            return "All models were successfully deleted."
        } catch(error) {
            console.log(error)
            return error;
        }
    }

    async getWinnerModels(contract, winners) {
        try {
            const modelsBinary = await (await contract).evaluateTransaction("GetWinnerModels", winners);
            const modelsString = utf8decoder.decode(modelsBinary);
            return JSON.parse(modelsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }
}

module.exports = {
    ModelApp
}