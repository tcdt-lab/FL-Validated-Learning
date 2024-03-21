"use strict";

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const {Contract} = require("fabric-contract-api");

class MainCoinTransfer extends Contract {
    async InitWallets(ctx) {
        /*
        * Initializes a ledger with some predefined wallets.
        * */

        for (let i = 1; i < 11; i++) {
            const wallet = {
                id: `main_${i}`,
                amount: 10.0
            }
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
        if (!walletBytes || walletBytes.length === 0) {
            throw Error(`No wallet exists with id ${id}.`);
        }

        return walletBytes.toString();
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

    async RunTrx(ctx, trx) {
        switch (trx.method) {
            case "put":
                const wallet = {
                    id : trx.walletId,
                    amount : trx.amount
                }
                await ctx.stub.putState(wallet.id, Buffer.from(stringify(sortKeysRecursive(wallet))));
                break;
            case "delete":
                await ctx.stub.deleteState(trx.walletId);
                break;
            case "transfer":
                const senderWalletString = await this.ReadWallet(ctx, trx.senderId);
                let senderWallet = JSON.parse(senderWalletString);
                senderWallet.amount = senderWallet.amount - trx.amount;
                const receiverWalletString = await this.ReadWallet(ctx, trx.receiverId);
                let receiverWallet = JSON.parse(receiverWalletString);
                receiverWallet.amount = receiverWallet.amount + trx.amount;
                await ctx.stub.putState(senderWallet.id, Buffer.from(stringify(sortKeysRecursive(senderWallet))));
                await ctx.stub.putState(receiverWallet.id, Buffer.from(stringify(sortKeysRecursive(receiverWallet))));
                break;
            default:
                throw Error("Wrong trx method.");
        }
    }

    async RunWinnerTransactions(ctx, winnersString) {
        const winners = JSON.parse(winnersString);
        for (const winner of winners) {
            const transactionsBinary = await ctx.stub.invokeChaincode("demoCC",
                ["GetTransactionsByAssignment", `miner_${winner.split("_")[1]}`], "demo");
            const transactionsString = transactionsBinary.payload.toString();
            const transactions = JSON.parse(transactionsString);
            for (const trx of transactions) {
                await this.RunTrx(ctx, trx);
            }
        }
    }
}

module.exports = MainCoinTransfer;