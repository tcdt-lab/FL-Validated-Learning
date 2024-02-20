'use strict';

const { TextDecoder } = require("util");
const utf8Decoder = new TextDecoder();

class TestApp {
    constructor() {}

    async initLedger(contract) {
        /*
        * Invokes the "InitLedger" function of testCC.
        * */
        try{
            await (await contract).submitTransaction("InitLedger");
            return "Ledger is initialized successfully.";
        } catch (error) {
            console.log(error);
            return error;
        }

    }

    async readTest(contract, id) {
        /*
        * Invokes the "ReadTest" function of testCC.
        * */
        try {
            const testBinary = await (await contract).evaluateTransaction("ReadTest", id);
            const testString = utf8Decoder.decode(testBinary);
            return JSON.parse(testString);
        } catch (error) {
            console.log(error);
            return error
        }
    }

    async createTest(contract, id, minerName, data) {
        /*
        * Invokes the "CreateTest" function of testCC.
        * */
        try {
            await (await contract).submitTransaction("CreateTest", id, minerName, data);
            return "Test data was successfully created.";
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async updateTest(contract, id, minerName, data) {
        /*
        * Invokes the "UpdateTest" function of testCC.
        * */
        try {
            await (await contract).submitTransaction("UpdateTest", id, minerName, data);
            return "Test data was successfully updated.";
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async deleteTest(contract, id) {
        /*
        * Invokes the "DeleteTest" function of testCC.
        * */
        try {
            await (await contract).submitTransaction("DeleteTest", id);
            return "Test data was successfully deleted.";
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    async getAllTests(contract) {
        /*
        * Invokes the "GetAllTests" function of testCC.
        * */
        try {
            const testsBinary = await (await contract).evaluateTransaction("GetAllTests");
            const testsString = utf8Decoder.decode(testsBinary);
            return JSON.parse(testsString);
        } catch (error) {
            console.log(error);
            return error;
        }
    }
}

module.exports = {
    TestApp
}