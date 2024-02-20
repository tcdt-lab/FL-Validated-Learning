'use strict';

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");


class PredPropose extends Contract {

    async InitLedger(ctx) {
        /*
        * Initializes the ledger with some predefined predictions.
        * */
        const predictions = [
            {
                id : "1",
                minerName : "Amirreza",
                predictions : [
                    {
                        testId : "2",
                        prediction : [0, 1, 1]
                    }
                ]
            },
            {
                id : "2",
                minerName : "Hasti",
                predictions : [
                    {
                        testId : "1",
                        prediction : [1, 0, 0]
                    }
                ]
            },
        ];

        for (const pred of predictions) {
            await ctx.stub.putState(pred.id, Buffer.from(stringify(sortKeysRecursive(pred))));
        }
    }

    async PredictionExists(ctx, id) {
        /*
        * Checks whether a prediction exists.
        * */
        const predBinary = await ctx.stub.getState(id);
        return predBinary && predBinary.length > 0;
    }

    async CreatePrediction(ctx, id, minerName, predictions) {
        /*
        * Creates a prediction based on given arguments.
        * */
        const predExists = await this.PredictionExists(ctx, id);
        if (predExists) {
            throw Error(`A prediction already exists with id ${id}.`);
        }
        const pred = {
            id : id,
            minerName : minerName,
            predictions : JSON.parse(predictions)
        }

        await ctx.stub.putState(pred.id, Buffer.from(stringify(sortKeysRecursive(pred))));

        return pred.toString();
    }

    async ReadPrediction(ctx, id) {
        /*
        * Reads a prediction based on given id.
        * */
        const predBinary = await ctx.stub.getState(id);
        if (!predBinary || predBinary.length === 0) {
            throw Error(`No prediction exists with id ${id}.`);
        }
        return predBinary.toString();
    }

    async DeletePrediction(ctx, id) {
        /*
        * Deletes a prediction based on given id.
        * */
        const predExists = this.PredictionExists(ctx, id);
        if (!predExists) {
            throw Error(`A prediction already exists with id ${id}.`);
        }

        await ctx.stub.deleteState(id);
    }

    async GetAllPredictions(ctx) {
        /*
        * Returns all the existing prediction records.
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

module.exports = PredPropose;