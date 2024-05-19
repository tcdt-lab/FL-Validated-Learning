# Miners
This code is initially configured to include 10 miners. However, it can easily be altered to contain more or less miners. If you want to include more miners in the network, simply copy and paste the code in one of the miner files, make sure the `run.py` file runs your new miners, and add the port number of your miner to the `app1.js` since it is the Admin of the network.

## Results
The results folder contains the locally trained models as well as the loss and accuracy value for each miner in each round of training. These files are helpful in observing the performance of each miner throughout training. Run `training_results.py` and `datasize_winners` to observe plots demonstrating the miners' performance.
