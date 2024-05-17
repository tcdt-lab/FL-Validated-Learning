# Proof of Collaborative Learning: A Multi-winner Federated Learning Consensus Mechanism

[Paper] 


The implementation of PoCL, a new consensus mechanism that replaces deep learning model training with the nonce value computation.
In PoCL, miners train global deep learning model using their local datasets. After training, each miner will distribute the trained model with some test data records to initiate the evaluation process. In this step, each miner uses its trained model to make predictions for the received test records. Predictions are sent to their respective miners which are used to vote the miners from best to worst. The votes of all miners are gathered and the top K miners with the most votes are selected as the winners. The transactions of the winner miners are combined into one block and added to the ledger. At last, the winning miners are rewarded based on the significance of their contributions.

The figure below illustrates the high-level architecture of PoCL.

![Design](./figures/Design%201.png "Title")

This implementaiton is based on a rudimentary cryptocurrency blockchain in which users propose transfer transactions. 
## Installation
We implement PoCL using Hyperledger Fabric and Tensorflow.
To install Tensorflow, use the instructions mentioned [here](https://www.tensorflow.org/install/pip).

To install Hyperledger Fabric, follow the commands mentioned [here](https://hyperledger-fabric.readthedocs.io/en/release-2.5/getting_started.html) to install the required docker images and binary files. Then, copy and paste the `bin` and `config` folders in the `fabric samples` directory.


## Running
By using the `run.py` file, we can run the network:

```
python3 run.py
```
This file should be modifed to 


We have modified the implementation to create multiple processes using one command. Hence, log files, located at `logs` directory, are created to observe the state of the framework at any time. 

The `stop.py` file can be used to stop all the processes created at the previous step.


## Guide to Files

### Clients
The `clients` folder holds the all client classes, including the miners, the aggregator, and the submitter. The `miner` directory contains one python file per miner to show the independent nature of miners. The `global model` directory holds the global deep learning model that is trained by all miners. The `aggregator` combines the winning miners using FedAvg to reach a new global model. In addition, the aggregator computes the rewards for the winning miners based on the significance of the difference they made to the previous global model. The `submitter` proposes transactions to be included in the blockchain.

### Chaincodes
In this network, we first validate all the proposed transactions and save the approved transactions in a channel named `demo`. The `demo-coin-transfer` folder contains the chaincode and applicattion to interact with these transactions. This chaincode is responsible for validating, storing, and assigning demo transactions to miners.

`model-propose`
`prediction-propose`
`vote-assign`
`main-coin-transfer`

