"""
To observe the relationship between data size and winning, first run the whole network using your desired
data distribution. Then, copy the winners printed at the end of app1.txt to "all_winners" below. Run this 
file to get the plot.
"""

import matplotlib.pyplot as plt

all_winners = [
  [ 'model_1', 'model_2', 'model_4', 'model_3', 'model_5' ],
  [ 'model_1', 'model_4', 'model_2', 'model_6', 'model_5' ],
  [ 'model_3', 'model_10', 'model_1', 'model_7', 'model_9' ],
  [ 'model_10', 'model_6', 'model_3', 'model_8', 'model_1' ],
  [ 'model_10', 'model_6', 'model_2', 'model_1', 'model_9' ],
  [ 'model_9', 'model_10', 'model_8', 'model_4', 'model_7' ],
  [ 'model_10', 'model_9', 'model_1', 'model_5', 'model_6' ],
  [ 'model_1', 'model_6', 'model_9', 'model_7', 'model_10' ],
  [ 'model_6', 'model_8', 'model_10', 'model_7', 'model_5' ],
  [ 'model_3', 'model_8', 'model_9', 'model_5', 'model_7' ],
  [ 'model_4', 'model_9', 'model_5', 'model_8', 'model_7' ],
  [ 'model_10', 'model_8', 'model_9', 'model_7', 'model_2' ],
  [ 'model_8', 'model_6', 'model_10', 'model_1', 'model_3' ],
  [ 'model_2', 'model_9', 'model_10', 'model_1', 'model_8' ],
  [ 'model_10', 'model_8', 'model_1', 'model_2', 'model_4' ],
  [ 'model_10', 'model_9', 'model_7', 'model_6', 'model_4' ],
  [ 'model_6', 'model_9', 'model_3', 'model_4', 'model_8' ],
  [ 'model_2', 'model_5', 'model_8', 'model_4', 'model_1' ],
  [ 'model_10', 'model_9', 'model_7', 'model_2', 'model_1' ],
  [ 'model_10', 'model_2', 'model_7', 'model_6', 'model_9' ]
]

rewards = [
    {
        "amount": 144.6916,
        "id": "miner_1"
    },
    {
        "amount": 95.4744,
        "id": "miner_2"
    },
    {
        "amount": 64.4416,
        "id": "miner_3"
    },
    {
        "amount": 75.4605,
        "id": "miner_4"
    },
    {
        "amount": 63.16179999999999,
        "id": "miner_5"
    },
    {
        "amount": 76.6261,
        "id": "miner_6"
    },
    {
        "amount": 53.30180000000001,
        "id": "miner_7"
    },
    {
        "amount": 55.3468,
        "id": "miner_8"
    },
    {
        "amount": 63.8688,
        "id": "miner_9"
    },
    {
        "amount": 57.058499999999995,
        "id": "miner_10"
    }
]

models = {}
for i in range(1, 11):
    models[f"model_{str(i)}"] = 0

for rounds in all_winners:
    for winner in rounds:
        models[winner] += 1

fig, axs = plt.subplots(3, 1)

for i in range(1, 11):
    bar = axs[2].bar(i - 1, rewards[i-1]['amount'], width=0.3, label=f"model_{str(i)}")
    axs[2].bar_label(bar)
axs[2].set_xticks(range(10), [f"model {str(i)}" for i in range(1, 11)])
axs[2].set_title("Reward distribution Between Different Miners.")

for i in range(1, 11):
    bar = axs[1].bar(i - 1, models[f"model_{str(i)}"], width=0.3, label=f"model_{str(i)}")
    axs[1].bar_label(bar)
axs[1].set_xticks(range(10), [f"model {str(i)}" for i in range(1, 11)])
axs[1].set_title("Winner distribution Between Different Miners.")

for i in range(1, 11):
    bar = axs[0].bar(i - 1, (11 - i) / 55, width=0.3, label=f"model_{str(i)}")
    axs[0].bar_label(bar)
axs[0].set_xticks(range(10), [f"data {str(i)}" for i in range(1, 11)])
axs[0].set_title("Data distribution Between Different Miners.")
plt.show()
