'use strict';

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");

class VoteAssign extends Contract {

    async InitLedger(ctx) {
        /*
        * Initializes the ledger with some predefined vote blocks
        * */
        const votes = [
            {
                id : "1",
                minerName : "Amirreza",
                votes : [
                    "Hasti", "Negin"
                ]
            },
            {
                id : "2",
                minerName: "Hasti",
                votes : [
                    "Amirreza", "Negin"
                ]
            }
        ];

        for (const vote of votes) {
            await ctx.stub.putState(vote.id, Buffer.from(stringify(sortKeysRecursive(vote))));
        }
    }

    async VoteExists(ctx, id) {
        /*
        * Checks whether a vote block exists with the given id.
        * */
        const voteBinary = await ctx.stub.getState(id);
        return voteBinary && voteBinary.length > 0;
    }

    async CreateVote(ctx, id, minerName, votes) {
        /*
        * Creates a vote block with the given args.
        * */
        const voteExists = await this.VoteExists(ctx, id);
        if (voteExists) {
            throw Error(`A vote block already exists with id ${id}.`);
        }

        const vote = {
            id : id,
            minerName : minerName,
            votes : JSON.parse(votes)
        }

        await ctx.stub.putState(vote.id, Buffer.from(stringify(sortKeysRecursive(vote))));

        return vote.toString();
    }

    async ReadVote(ctx, id) {
        /*
        * Reads a vote block with the given args.
        * */
        const voteBinary = await ctx.stub.getState(id);
        if (!voteBinary || voteBinary.length === 0) {
            throw Error(`No vote block exists with id ${id}.`);
        }
        return voteBinary.toString();
    }

    async DeleteVote(ctx, id) {
        /*
        * Deletes a vote block with the given args.
        * */
        const voteExists = await this.VoteExists(ctx, id);
        if (!voteExists) {
            throw Error(`No vote block exists with id ${id}.`);
        }
        await ctx.stub.deleteState(id);
    }

    async GetAllVotes(ctx) {
        /*
        * Returns all the existing vote blocks.
        * */
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = VoteAssign;