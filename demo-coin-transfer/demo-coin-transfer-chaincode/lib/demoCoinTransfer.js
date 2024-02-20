"use strict";

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");

class DemoCoinTransfer extends  Contract {
    async InitTransactions(ctx) {
        /*
        * Initializes a ledger with some predefined transactions.
        *
        * Transaction structure:
        *
        * id : identifier of the transaction [String]
        * method : the stub method that needs to be called after the transaction is mined. [String]
        * (Since we are validating transactions on the demo chaincode, we only submit them on the main chaincode.)
        * walletID : which wallet(s) is this transaction concerned about. [String]
        * amount : transaction amount [Float]
        * assigned : which miner has been assigned with this transaction [String]
        * (This helps us uniquely assign each transaction to one miner only)
        * */

        const transactions = [
            {
                id : "demo_1",
                method : "put",
                walletId : "4",
                amount : 1.0,
                assigned : null,
            },
            {
                id: "demo_2",
                method : "put",
                walletId : "5",
                amount : 2.0,
                assigned : null,
            },
            {
                id: "demo_3",
                method : "put",
                walletId : "6",
                amount : 3.0,
                assigned : null,
            }
        ];

        for (const trx of transactions) {
            await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
        }
    }

    async MainWalletExists(ctx, walletId) {
        /*
        * Checks if a wallet exists on the main ledger.
        * */

        const chaincodeResponse = await ctx.stub.invokeChaincode("mainCC", ["WalletExists", walletId], "main");
        return JSON.parse(chaincodeResponse.payload.toString());
    }

    async DemoTrxExists(ctx, id){
        /*
        * Checks if a transaction exists on the ledger.
        * */

        const trx = await ctx.stub.getState(id);
        return trx && trx.length > 0;
    }

    async ReadTrx(ctx, id) {
        /*
        * Returns the transaction belonging to the input id.
        * */

        const TrxBytes = await ctx.stub.getState(id);
        if (! TrxBytes || TrxBytes.length === 0) {
            throw Error(`No transaction exists with id ${id}.`);
        }

        return TrxBytes.toString();
    }
    //
    async CreateWalletTrx(ctx, id, walletId, amount) {
        /*
        * Validates and creates a "create wallet" transaction based on the inputs it receives.
        * */

        const walletExists = await this.MainWalletExists(ctx, walletId);
        if (walletExists) {
            throw Error(`A wallet already exists with id ${walletId}.`);
        }

        const trxExists = await this.DemoTrxExists(ctx, id);
        if (trxExists) {
            throw Error(`A transaction already exists with id ${id}.`);
        }

        const trx = {
            id : id,
            method : "put",
            walletId : walletId,
            amount : parseFloat(JSON.parse(amount)),
            assigned : null
        };

        await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
    }
    //
    async UpdateWalletTrx(ctx, id, walletId, amount) {
        /*
        * Validates and creates "update wallet" transaction for an already existing wallet based on the inputs it receives.
        * */

        const walletExists = this.MainWalletExists(ctx, id);
        if (!walletExists) {
            throw Error(`No wallet exists with id ${walletId}.`);
        }

        const trxExists = await this.DemoTrxExists(ctx, id);
        if (trxExists) {
            throw Error(`A transaction already exists with id ${id}.`);
        }

        const trx = {
            id : id,
            method : "put",
            walletId : walletId,
            amount : parseFloat(amount),
            assigned : null
        };

        await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
    }
    //
    async DeleteWalletTrx(ctx, id, walletId) {
        /*
        * Validates and creates a "delete wallet" transaction using an already existing wallet's id.
        * */

        const walletExists = this.MainWalletExists(ctx, id);
        if (!walletExists) {
            throw Error(`No wallet exists with id ${id}`);
        }

        const trxExists = await this.DemoTrxExists(ctx, id);
        if (trxExists) {
            throw Error(`A transaction already exists with id ${id}.`);
        }

        const trx = {
            id : id,
            method : "delete",
            walletId : walletId,
            assigned : null
        }

        await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
    }

    async GetAllTransactions(ctx) {
        /*
        * Returns all the existing transactions.
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
            if (record.id.startsWith("demo")) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async TransferCoinsTrx(ctx, id, senderId, receiverId, amount) {
        /*
        * Validates and creates a "transfer coins" transaction with wallet ids of sender and receiver.
        */

        const senderWalletResponse = await ctx.stub.invokeChaincode("mainCC", ["ReadWallet", senderId], "main");
        const walletExists = await this.MainWalletExists(ctx, receiverId);
        if (!walletExists) {
            throw Error(`No wallet exists with id ${receiverId}.`);
        }

        const senderWallet = JSON.parse(senderWalletResponse.payload.toString());
        if (senderWallet.amount < parseFloat(amount)) {
            throw Error("The sender wallet does not have enough coins for this transaction.");
        }

        const trxExists = await this.DemoTrxExists(ctx, id);
        if (trxExists) {
            throw Error(`A transaction already exists with id ${id}.`);
        }

        const trx = {
            id : id,
            method : "transfer",
            senderId : senderId,
            receiverId : receiverId,
            amount : amount,
            assigned : null
        }

        await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
    }

    async AssignTransactions(ctx, minerName, count) {
        const assigned = [];
        count = parseInt(count)
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done && assigned.length < count) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if (record.assigned === null) {
                record.assigned = minerName;
                assigned.push(record);
            }
            result = await iterator.next();
        }
        if (assigned.length === 0) {
            throw Error("Sorry, no unassigned transaction exists at the moment.");
        }
        for (const trx of assigned) {
            await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
        }
        return JSON.stringify(assigned);
    }
}

module.exports = DemoCoinTransfer;