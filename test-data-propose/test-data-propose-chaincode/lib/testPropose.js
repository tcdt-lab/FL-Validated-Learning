'use strict';

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");


class TestPropose extends  Contract {

    async InitLedger(ctx) {
        const tests = [
            {
                id : "1",
                minerName : "Amirreza",
                data : [0, 1, 2]
            },
            {
                id : "2",
                minerName : "Hasti",
                data : [2, 3, 4]
            }
        ];

        for (const testData of tests) {
            ctx.stub.putState(testData.id, Buffer.from(stringify(sortKeysRecursive(testData))));
        }
    }

    async TestExists(ctx, id) {
        const testBinary = await ctx.stub.getState(id);
        return testBinary && testBinary.length > 0;
    }

    async CreateTest(ctx, id, minerName, data) {
        const testExists = await this.TestExists(ctx, id);
        if (testExists) {
            throw Error(`A test data already exists with id ${id}.`);
        }
        const test = {
            id : id,
            minerName : minerName,
            data : JSON.parse(data)
        }
        await ctx.stub.putState(test.id, Buffer.from(stringify(sortKeysRecursive(test))));

        return test.toString();
    }

    async UpdateTest(ctx, id, minerName, data) {
        const testExists = await this.TestExists(ctx, id);
        if (!testExists) {
            throw Error(`No test data exists with id ${id}.`);
        }
        const test = {
            id : id,
            minerName : minerName,
            data : JSON.parse(data)
        }

        await ctx.stub.putState(test.id, Buffer.from(stringify(sortKeysRecursive(test))));
    }

    async ReadTest(ctx, id) {
        const testBinary = await ctx.stub.getState(id);
        if (!testBinary || testBinary.length === 0) {
            throw Error(`No test data exists with id ${id}.`);
        }
        return testBinary.toString();
    }

    async DeleteTest(ctx, id) {
        const testExists = await this.TestExists(ctx, id);
        if (!testExists) {
            throw Error(`No test data exists with id ${id}.`);
        }
        await ctx.stub.deleteState(id);
    }

    async GetAllTests(ctx) {
        /*
        * Returns all the existing test data records.
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

module.exports = TestPropose;