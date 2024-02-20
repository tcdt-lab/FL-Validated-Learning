'use strict';

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");

class VoteAssign extends Contract {

    async InitVotes(ctx) {
        /*
        * Initializes the ledger with some predefined vote blocks
        * */
        const votes = [
            {
                id : "vote_1",
                votes : [
                    "model_2", "model_3", "model_4"
                ]
            },
            {
                id : "vote_2",
                votes : [
                    "model_1", "model_3", "model_4"
                ]
            },
            {
                id : "vote_3",
                votes : [
                    "model_1", "model_2", "model_4"
                ]
            },
            {
                id : "vote_4",
                votes : [
                    "model_1", "model_2", "model_3"
                ]
            },
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

    async CreateVote(ctx, id, votes) {
        /*
        * Creates a vote block with the given args.
        * */
        const voteExists = await this.VoteExists(ctx, id);
        if (voteExists) {
            throw Error(`A vote block already exists with id ${id}.`);
        }

        const vote = {
            id : id,
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
            if (record.id.startsWith("vote")) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async SelectWinners(ctx, count) {
        const votesString = await this.GetAllVotes(ctx);
        const votes = JSON.parse(votesString);
        let board = {};
        for (const voter of votes) {
            for (let i = 0 ; i < voter.votes.length ; i++) {
                if (board[voter.votes[i]] == null) {
                    board[voter.votes[i]] = voter.votes.length - i;
                } else {
                    board[voter.votes[i]] += voter.votes.length;
                }
            }
        }
        const jsonArray = Object.entries(board);
        jsonArray.sort((a, b) => a[0].localeCompare(b[0]));
        board = Object.fromEntries(jsonArray.slice(0, count));
        const winners = Object.keys(board);
        return JSON.stringify(winners);
    }

    async DeleteAllVotes(ctx) {
        const votesString = await this.GetAllVotes(ctx);
        const votes = JSON.parse(votesString);
        for (const vote of votes){
            await ctx.stub.deleteState(vote.id);
        }
    }
}

module.exports = VoteAssign;