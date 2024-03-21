"use strict";

const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");
const { Mutex } = require("async-mutex")

class DemoCoinTransfer extends  Contract {
    constructor() {
        super();
        this.mutex = new Mutex();
    }

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
                walletId : "main_11",
                amount : 10.0,
                assigned : null,
            },
            {
                id: "demo_2",
                method : "put",
                walletId : "main_12",
                amount : 10.0,
                assigned : null,
            },
            {
                id: "demo_3",
                method : "put",
                walletId : "main_13",
                amount : 10.0,
                assigned : null,
            },
            {
                id : "demoCount",
                current : 4
            },
            {
                id : "modelAcceptingInfo",
                accepting : false
            },
            {
                id : "rangeInfo",
                assigned:  []
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

    async GetCurrentDemoId(ctx){
        /*
        * Gets the current transaction ID.
        * */

        const countBinary = await ctx.stub.getState("demoCount");
        const countString = countBinary.toString();
        const countBlock = JSON.parse(countString);
        return "demo_" + countBlock.current.toString();
    }

    async UpdateCurrentDemoId(ctx) {
        /*
        * Updates the current transaction ID.
        * */

        const countBinary = await ctx.stub.getState("demoCount");
        const countString = countBinary.toString();
        let countBlock = JSON.parse(countString);

        countBlock.current = countBlock.current + 1;
        await ctx.stub.putState(countBlock.id, Buffer.from(stringify(sortKeysRecursive(countBlock))));
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
    async CreateWalletTrx(ctx, walletId, amount) {
        /*
        * Validates and creates a "create wallet" transaction based on the inputs it receives.
        * */
        const id = await this.GetCurrentDemoId(ctx)

        const walletExists = await this.MainWalletExists(ctx, walletId);
        if (walletExists) {
            throw Error(`A wallet already exists with id ${walletId}.`);
        }

        const trx = {
            id : id,
            method : "put",
            walletId : walletId,
            amount : parseFloat(amount),
            assigned : null
        };

        await this.UpdateCurrentDemoId(ctx);

        await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
    }
    //
    async UpdateWalletTrx(ctx, walletId, amount) {
        /*
        * Validates and creates "update wallet" transaction for an already existing wallet based on the inputs it receives.
        * */

        const id = await this.GetCurrentDemoId(ctx);

        const walletExists = this.MainWalletExists(ctx, walletId);
        if (!walletExists) {
            throw Error(`No wallet exists with id ${walletId}.`);
        }

        const trx = {
            id : id,
            method : "put",
            walletId : walletId,
            amount : parseFloat(amount),
            assigned : null
        };

        await this.UpdateCurrentDemoId(ctx);

        await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
    }
    //
    async DeleteWalletTrx(ctx, walletId) {
        /*
        * Validates and creates a "delete wallet" transaction using an already existing wallet's id.
        * */

        const id = await this.GetCurrentDemoId(ctx);

        const walletExists = this.MainWalletExists(ctx, walletId);
        if (!walletExists) {
            throw Error(`No wallet exists with id ${id}`);
        }

        const trx = {
            id : id,
            method : "delete",
            walletId : walletId,
            assigned : null
        }

        await this.UpdateCurrentDemoId(ctx)

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

    async TransferCoinsTrx(ctx, senderId, receiverId, amount) {
        /*
        * Validates and creates a "transfer coins" transaction with wallet ids of sender and receiver.
        */
        const release = await this.mutex.acquire();
        try {
            const id = await this.GetCurrentDemoId(ctx)

        
            const walletExists = await this.MainWalletExists(ctx, receiverId);
            if (!walletExists) {
                throw Error(`No wallet exists with id ${receiverId}.`);
            }
            
            const senderWalletResponse = await ctx.stub.invokeChaincode("mainCC", ["ReadWallet", senderId], "main");
            const senderWallet = JSON.parse(senderWalletResponse.payload.toString());
            if (senderWallet.amount < parseFloat(amount)) {
                throw Error("The sender wallet does not have enough coins for this transaction.");
            }
    
            const trx = {
                id : id,
                method : "transfer",
                senderId : senderId,
                receiverId : receiverId,
                amount : parseFloat(amount),
                assigned : null
            }
    
            await this.UpdateCurrentDemoId(ctx);
    
            await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
        } finally {
            release();
        }
    }

    async ToggleAcceptingStatus(ctx) {
        /*
        * Toggles the accepting status at this moment
        * */
        const infoBytes = await ctx.stub.getState("modelAcceptingInfo");
        const infoString = infoBytes.toString();
        let info = JSON.parse(infoString);
        info.accepting = !info.accepting;
        await ctx.stub.putState(info.id, Buffer.from(stringify(sortKeysRecursive(info))));
    }

    async GetAcceptingStatus(ctx) {
        /*
        * Returns the accepting status at this moment
        * */
        const infoBytes = await ctx.stub.getState("modelAcceptingInfo");
        const infoString = infoBytes.toString();
        const info = JSON.parse(infoString);
        return info.accepting;
    }

    async AssignTransactions(ctx, minerName, count) {
        /*
        * Assigns not-assigned transactions to miners.
        * The 'status' is used for letting the miners know about the status of their request.
        * */
        const release = await this.mutex.acquire();
        try {
            const accepting = await this.GetAcceptingStatus(ctx);

            if (!accepting) {
                const res = {
                    status : "Failed",
                    message : "Sorry, we are not accepting assignment requests at the moment."
                }
                return JSON.stringify(res)
            }
    
            // let rangeInfoString = await this.ReadTrx(ctx, "rangeInfo");
            // let rangeInfo = JSON.parse(rangeInfoString);
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
                    // if (rangeInfo.firstAssigned === "") {
                    //     rangeInfo.firstAssigned = record.id
                    // } else {
                    //     rangeInfo.lastAssigned = record.id
                    // }
                    record.assigned = minerName;
                    assigned.push(record);
                }
                result = await iterator.next();
            }
            if (assigned.length === 0) {
                const res = {
                    status : "Failed",
                    message : "Sorry, no unassigned transaction exists at the moment."
                }
                return JSON.stringify(res)
            }
    
            let assigned_ids = [];
            for (const trx of assigned) {
                assigned_ids.push(trx.id);
                await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
            }
    
            const rangeInfo = {
                id : "rangeInfo",
                assigned : assigned_ids
            }
    
            await ctx.stub.putState(rangeInfo.id, Buffer.from(stringify(sortKeysRecursive(rangeInfo))));
    
            var res = {
                status : "Accepted",
                data : assigned
            }
        } finally {
            release();
        }
        
        return JSON.stringify(res);
    }

    async GetTransactionsByAssignment(ctx, name) {
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
            if ((record.id.startsWith("demo_")) && (record.assigned === name)) {
                allResults.push(record);
            }
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async DemoTrxExists (ctx, id) {
        const trxBytes = await ctx.stub.getState(id);
        return trxBytes && trxBytes.length > 0;
    }

    async DeleteDemoTrx(ctx, id) {
        const exists = await this.DemoTrxExists(ctx, id);
        if (!exists) {
            throw Error(`No demo trx exists with id ${id}.`);
        }
        await ctx.stub.deleteState(id);
    }

    // async RefreshTransactions(ctx, winners) {
    //     let rangeInfoString = await this.ReadTrx(ctx, "rangeInfo");
    //     let rangeInfo = JSON.parse(rangeInfoString);
    //
    //     const deleteList = [];
    //     winners = JSON.parse(winners);
    //     // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    //     const iterator = await ctx.stub.getStateByRange(rangeInfo.firstAssigned, rangeInfo.lastAssigned);
    //     let result = await iterator.next();
    //     while (!result.done) {
    //         const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
    //         let record;
    //         try {
    //             record = JSON.parse(strValue);
    //         } catch (err) {
    //             console.log(err);
    //             record = strValue;
    //         }
    //         if ((record.id.startsWith("demo_")) && (record.assigned != null)) {
    //             if (winners.includes(`miner_${record.assigned.charAt(record.assigned.length - 1)}`)) {
    //                 deleteList.push(record);
    //             } else {
    //                 record.assigned = null;
    //                 await ctx.stub.putState(record.id, Buffer.from(stringify(sortKeysRecursive(record))));
    //             }
    //         }
    //         result = await iterator.next();
    //     }
    //     for (const record of deleteList) {
    //         await ctx.stub.deleteState(record.id);
    //     }
    //
    //     rangeInfo.firstAssigned = "";
    //     rangeInfo.lastAssigned = "";
    //     await ctx.stub.putState(rangeInfo.id, Buffer.from(stringify(sortKeysRecursive(rangeInfo))));
    // }
    async RefreshTransactions(ctx, winners) {
        let rangeInfoString = await this.ReadTrx(ctx, "rangeInfo");
        let rangeInfo = JSON.parse(rangeInfoString);
        let deleteList = [];

        for (const trxId of rangeInfo.assigned) {
            let trxString = await this.ReadTrx(ctx, trxId);
            let trx = JSON.parse(trxString);
            if (winners.includes(`miner_${trx.assigned.split("_")[1]}`)) {
                deleteList.push(trx);
            } else {
                trx.assigned = null;
                await ctx.stub.putState(trx.id, Buffer.from(stringify(sortKeysRecursive(trx))));
            }
        }

        for (const record of deleteList) {
            await ctx.stub.deleteState(record.id);
        }

        rangeInfo.assigned = [];
        await ctx.stub.putState(rangeInfo.id, Buffer.from(stringify(sortKeysRecursive(rangeInfo))));
    }

}

module.exports = DemoCoinTransfer;