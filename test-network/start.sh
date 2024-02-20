./network.sh up
./network.sh createChannel -c demo
./network.sh createChannel -c main
./network.sh deployCC -ccp ../demo-coin-transfer/demo-coin-transfer-chaincode -ccn demoCC -c demo -ccl javascript
./network.sh deployCC -ccp ../model-propose/model-propose-chaincode -ccn modelCC -c demo -ccl javascript
./network.sh deployCC -ccp ../prediction-propose/prediction-propose-chaincode -ccn predCC -c demo -ccl javascript
./network.sh deployCC -ccp ../vote-assign/vote-assign-chaincode -ccn voteCC -c demo -ccl javascript
./network.sh deployCC -ccp ../main-coin-transfer/main-coin-transfer-chaincode -ccn mainCC -c main -ccl javascript