"use strict";

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");

class CoinTransfer extends  Contract {
    async InitLedger(ctx) {
        /*
        * Initializes a ledger with some predefined wallets.
        * */

        const wallets = [
            {
                id : "1",
                name : "Amirreza",
                amount : 1.0
            },
            {
                id : "2",
                name : "Saeed",
                amount : 2.0
            },
            {
                id : "3",
                name : "Koosha",
                amount : 3.0
            }
        ];

        for (const wallet of wallets) {

            await ctx.stub.putState(wallet.id, Buffer.from(stringify(sortKeysRecursive(wallet))));
        }
    }

    async WalletExists(ctx, id) {
        /*
        * Checks if a wallet exists.
        * */

        const walletBytes = await ctx.stub.getState(id);
        return walletBytes && walletBytes.length > 0;
    }

    async ReadWallet(ctx, id) {
        /*
        * Returns the wallet belonging to the input id.
        * */

        const walletBytes = await ctx.stub.getState(id);
        if (! walletBytes || walletBytes.length === 0) {
            throw Error(`No wallet exists with id ${id}.`);
        }

        return walletBytes.toString();
    }

    async CreateWallet(ctx, id, name, amount) {
        /*
        * Creates a wallet based on the inputs it receives.
        * */

        const walletExists = await this.WalletExists(ctx, id);
        if (walletExists) {
            throw Error(`A wallet already exists with id ${id}.`);
        }

        const wallet = {
            id : id,
            name : name,
            amount : parseFloat(JSON.parse(amount))
        };

        await ctx.stub.putState(wallet.id, Buffer.from(stringify(sortKeysRecursive(wallet))));
    }

    async UpdateWallet(ctx, id, name, amount) {
        /*
        * Updates an already existing wallet based on the inputs it receives.
        * */

        const walletExists = this.WalletExists(ctx, id);

        if (!walletExists) {
            throw Error(`No wallet exists with id ${id}.`);
        }

        const wallet = {
            name : name,
            id : id,
            amount : parseFloat(JSON.parse(amount))
        }

        await ctx.stub.putState(wallet.id, Buffer.from(stringify(sortKeysRecursive(wallet))));
    }

    async DeleteWallet(ctx, id) {
        /*
        * Deletes an already existing wallet using its id.
        * */

        const walletExists = this.WalletExists(ctx, id);

        if (!walletExists) {
            throw Error(`No wallet exists with id ${id}`);
        }

        await ctx.stub.deleteState(id);
    }

    async GetAllWallets(ctx) {
        /*
        * Returns all the existing wallets.
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

module.exports = CoinTransfer;