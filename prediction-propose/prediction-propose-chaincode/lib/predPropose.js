'use strict';

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");


class PredPropose extends Contract {
    async InitPredictions(ctx) {
        /*
        * Initializes the ledger with some predefined predictions.
        * */
        const accepting = {
            id : "predAcceptingInfo",
            accepting : false
        };

        await ctx.stub.putState(accepting.id, Buffer.from(stringify(sortKeysRecursive(accepting))));
    }

    async ToggleAcceptingStatus(ctx) {
        /*
        * Toggles the accepting status at this moment
        * */
        const infoBytes = await ctx.stub.getState("predAcceptingInfo");
        const infoString = infoBytes.toString();
        let info = JSON.parse(infoString);
        info.accepting = !info.accepting;
        await ctx.stub.putState(info.id, Buffer.from(stringify(sortKeysRecursive(info))));
    }

    async GetAcceptingStatus(ctx) {
        /*
        * Returns the accepting status at this moment
        * */
        const infoBytes = await ctx.stub.getState("predAcceptingInfo");
        const infoString = infoBytes.toString();
        const info = JSON.parse(infoString);
        return info.accepting;
    }

    async PredictionExists(ctx, id) {
        /*
        * Checks whether a prediction exists.
        * */
        const predBinary = await ctx.stub.getState(id);
        return predBinary && predBinary.length > 0;
    }

    async CreatePrediction(ctx, id, predictions) {
        /*
        * Creates a prediction based on given arguments.
        * */
        const accepting = await this.GetAcceptingStatus(ctx);
        if (!accepting) {
            throw Error("Sorry, we are not accepting predictions at the moment.");
        }

        const predExists = await this.PredictionExists(ctx, id);
        if (predExists) {
            throw Error(`A prediction already exists with id ${id}.`);
        }
        const pred = {
            id : id,
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
            if (record.id.startsWith("pred_")) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GatherAllPredictions(ctx, id) {
        const predictionsString = await this.GetAllPredictions(ctx);
        const predictions = JSON.parse(predictionsString);
        let specificPrediction = {};
        for (const prediction of predictions) {
            if (prediction.predictions[id] != null) {
                specificPrediction[prediction.id] = prediction.predictions[id];
            }
        }
        return JSON.stringify(specificPrediction);
    }
}

module.exports = PredPropose;