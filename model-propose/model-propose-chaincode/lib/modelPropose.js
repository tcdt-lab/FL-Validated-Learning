'use strict';

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");


class ModelPropose extends Contract {
    async InitLedger(ctx) {
        /*
        * Initializes the ledger with some predefined models.
        * */
        const models = [
            {
                id : "1",
                minerName : "harry",
                hash : "abcd",
                transactions : ["1", "2", "3"]
            },
            {
                id : "2",
                minerName : "voldemort",
                hash : "bcde",
                transactions: ["4"]
            },
            {
                id: "3",
                minerName : "Snape",
                hash: "cdef",
                transactions: ["5", "6"]
            }
        ];

        for (const model of models) {
            await ctx.stub.putState(model.id, Buffer.from(stringify(sortKeysRecursive(model))));
        }
    }

    async ModelExists(ctx, id) {
        /*
        * Checks whether a model exists with the provided id.
        * */
        const modelBinary = await ctx.stub.getState(id);
        return modelBinary && modelBinary.length > 0;
    }

    async CreateModel(ctx, id, minerName, hash, transactions){
        /*
        * Creates a new model with given parameters.
        * */
        const modelExists = await this.ModelExists(ctx, id);
        if (modelExists) {
            throw Error(`A model already exists with id ${id}.`);
        }

        const model = {
            id : id,
            minerName : minerName,
            hash : hash,
            transactions : JSON.parse(transactions)
        }

        await ctx.stub.putState(model.id, Buffer.from(stringify(sortKeysRecursive(model))));

        return model.toString();
    }

    async DeleteModel(ctx, id) {
        /*
        * Deletes a model containing the given id.
        * */
        const modelExists = await this.ModelExists(ctx, id);

        if (!modelExists) {
            throw Error(`No model exists with id ${id}.`);
        }

        await ctx.stub.deleteState(id);
    }

    async ReadModel(ctx, id) {
        /*
        * Returns a model with the given id.
        * */
        const modelBinary = await ctx.stub.getState(id);
        if (!modelBinary || modelBinary.length === 0) {
            throw Error(`No model exists with id ${id}.`);
        }
        return modelBinary.toString();
    }

    async GetAllModels(ctx) {
        /*
        * Returns all the existing models.
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

module.exports = ModelPropose