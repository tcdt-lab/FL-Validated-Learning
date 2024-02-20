'use strict';

const { TextDecoder } = require("util");
const utf8decoder = new TextDecoder();

class VoteApp {
    constructor() {}

    async initLedger(contract) {
        /*
        * Invokes the init ledger function of the chaincode.
        * */
        try {
            await (await contract).submitTransaction("InitLedger");
            return "Ledger was successfully initialized.";
        } catch(error) {
            console.log(error);
            return error;
        }
    }

    async getAllVotes(contract) {
        /*
        * Invokes the get all votes function of the chaincode.
        * */
        try {
            const votesBinary = await (await contract).evaluateTransaction("GetAllVotes");
            const votesString = utf8decoder.decode(votesBinary);
            return JSON.parse(votesString);
        } catch(error) {
            console.log(error);
            return error;
        }
    }

    async readVote(contract, id) {
        /*
        * Invokes the read vote function of the chaincode.
        * */
        try {
            const voteBinary = await (await contract).evaluateTransaction("ReadVote", id);
            const voteString = utf8decoder.decode(voteBinary);
            return JSON.parse(voteString);
        } catch(error) {
            console.log(error);
            return error;
        }
    }

    async createVote(contract, id, minerName, votes) {
        /*
        * Invokes the create vote function of the chaincode.
        * */
        try {
            await (await contract).submitTransaction("CreateVote", id, minerName, votes);
            return "The vote block was successfully created.";
        } catch(error) {
            console.log(error);
            return error;
        }
    }

    async deleteVote(contract, id) {
        /*
        * Invokes the delete vote function of the chaincode.
        * */
        try {
            await (await contract).submitTransaction("DeleteVote", id);
            return "The vote block was successfully deleted.";
        } catch(error) {
            console.log(error);
            return error;
        }
    }
}

module.exports = {
    VoteApp
}