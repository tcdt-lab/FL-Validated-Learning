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