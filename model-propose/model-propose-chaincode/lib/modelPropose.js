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
            await ctx.stub.putState(model.id, Buffer.from(stringify(model)));
        }
    }

    async ModelExists(ctx, id) {
        /*
        * Checks whether a model exists with the provided id.
        * */
        const modelBinary = await ctx.stub.getState(id);
        return modelBinary && modelBinary.length > 0;
    }

    async CheckCreateModel(ctx, id) {
        const acceptingBinary = await ctx.stub.invokeChaincode("demoCC", ["GetAcceptingStatus"], "demo");
        const accepting = Boolean(acceptingBinary.toString());

        if (! accepting) {
            return false.toString();
        }

        const modelExists = await this.ModelExists(ctx, id);
        if (modelExists) {
            return false.toString();
        }

        return true.toString();
    }

    async CreateModel(ctx, id, hash, path, transactions, testData){
        /*
        * Creates a new model with given parameters.
        * */

        // const acceptingBinary = await ctx.stub.invokeChaincode("demoCC", ["GetAcceptingStatus"], "demo");
        // const accepting = Boolean(acceptingBinary.toString());
        // if (! accepting) {
        //     throw Error(`Sorry, we are not accepting models right now.`);
        // }
        //
        // const modelExists = await this.ModelExists(ctx, id);
        // if (modelExists) {
        //     throw Error(`A model already exists with id ${id}.`);
        // }

        const model = {
            id : id,
            hash : hash,
            path : path,
            transactions : JSON.parse(transactions),
            testData : JSON.parse(testData)
        }

        await ctx.stub.putState(model.id, Buffer.from(stringify(model)));

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
        const testRecords = {};
        for (const model of models) {
            testRecords[model.id] = model.testData
        }
        const testRecordsBlock = {
            id : "testRecords",
            testRecords : testRecords
        }
        await ctx.stub.putState(testRecordsBlock.id, Buffer.from(stringify(testRecordsBlock)));

        return JSON.stringify(testRecordsBlock);
    }

    async DeleteAllModels(ctx) {
        const modelsString = await this.GetAllModels(ctx);
        const models = JSON.parse(modelsString);
        for (const model of models){
            await ctx.stub.deleteState(model.id);
        }
    }

    async GetWinnerModels(ctx, winners) {
        const results = [];
        winners = JSON.parse(winners);
        for (const winner of winners) {
            const modelString = await this.ReadModel(ctx, winner);
            const model = JSON.parse(modelString);
            results.push({
                "id" : model.id,
                "hash" : model.hash,
                "path" : model.path
            });
        }
        return JSON.stringify(results);
    }
}

module.exports = ModelPropose