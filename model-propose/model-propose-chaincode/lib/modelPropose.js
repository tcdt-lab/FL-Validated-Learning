'use strict';

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");


class ModelPropose extends Contract {
    async InitModels(ctx) {
        /*
        * Initializes the ledger with some predefined models.
        * */
        const models = [
            {
                id : "model_1",
                hash : "abcd",
                transactions : ["demo_1", "demo_2", "demo_3"],
                testData : [
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]
                ]
            },
            {
                id : "model_2",
                hash : "bcde",
                transactions: ["demo_4"],
                testData : [
                    [0, 1, 0],
                    [0, 1, 0],
                    [0, 1, 0]
                ]
            },
            {
                id: "3",
                hash: "cdef",
                transactions: ["demo_5", "demo_6"],
                testData : [
                    [0, 0, 1],
                    [0, 1, 0],
                    [1, 0, 0]
                ]
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

    async CreateModel(ctx, id, hash, transactions, testData){
        /*
        * Creates a new model with given parameters.
        * */

        // TODO: Insert check for accepting status

        const modelExists = await this.ModelExists(ctx, id);
        if (modelExists) {
            throw Error(`A model already exists with id ${id}.`);
        }

        const model = {
            id : id,
            hash : hash,
            transactions : JSON.parse(transactions),
            testData : JSON.parse(testData)
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
            if (record.id.startsWith("model")) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GatherAllTestRecords(ctx) {
        const modelsString = await this.GetAllModels(ctx);
        const models = JSON.parse(modelsString);
        const testRecords = [];
        for (const model of models) {
            const testRecord = {
                [model.id] : model.testData
            }
            testRecords.push(testRecord)
        }
        const testRecordsBlock = {
            id : "testRecords",
            testRecords : testRecords
        }
        await ctx.stub.putState(testRecordsBlock.id, Buffer.from(stringify(sortKeysRecursive(testRecordsBlock))));

        return JSON.stringify(testRecordsBlock);
    }
}

module.exports = ModelPropose