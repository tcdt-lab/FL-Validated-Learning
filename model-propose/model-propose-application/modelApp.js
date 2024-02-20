'use strict';

const { TextDecoder } = require("util");
const utf8decoder = new TextDecoder();

class ModelApp {
    constructor() {}

    async initLedger(contract) {
        /*
        * Invokes the initial ledger function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("InitLedger");
            return "Ledger was successfully initialized.";
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async createModel(contract, id, minerName, hash, transactions) {
        /*
        * Invokes the create model function of chaincode modelCC.
        * */
        try {
            await (await contract).submitTransaction("CreateModel", id, minerName, hash, transactions);
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

    async deleteModel(contact, id) {
        /*
        * Invokes the delete model function of chaincode modelCC.
        * */
        try {
            await (await contact).submitTransaction("DeleteModel", id);
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

}

module.exports = {
    ModelApp
}