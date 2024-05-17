"""
To observe the relationship between data size and winning, first run the whole network using your desired
data distribution. Then, copy the winners printed at the end of app1.txt to "all_winners" below. Run this 
file to get the plot.
"""

import matplotlib.pyplot as plt

# Normal
all_winners = [
  [ 'model_10', 'model_8', 'model_6', 'model_7', 'model_9' ],
  [ 'model_8', 'model_10', 'model_6', 'model_9', 'model_7' ],
  [ 'model_7', 'model_3', 'model_6', 'model_8', 'model_9' ],
  [ 'model_2', 'model_3', 'model_5', 'model_1', 'model_7' ],
  [ 'model_1', 'model_4', 'model_5', 'model_3', 'model_8' ],
  [ 'model_5', 'model_4', 'model_8', 'model_3', 'model_10' ],
  [ 'model_2', 'model_3', 'model_1', 'model_5', 'model_4' ],
  [ 'model_9', 'model_8', 'model_5', 'model_6', 'model_4' ],
  [ 'model_5', 'model_2', 'model_4', 'model_1', 'model_8' ],
  [ 'model_10', 'model_3', 'model_4', 'model_7', 'model_1' ],
  [ 'model_2', 'model_4', 'model_5', 'model_3', 'model_8' ],
  [ 'model_1', 'model_3', 'model_7', 'model_8', 'model_5' ],
  [ 'model_2', 'model_3', 'model_10', 'model_1', 'model_4' ],
  [ 'model_4', 'model_2', 'model_5', 'model_1', 'model_3' ],
  [ 'model_1', 'model_8', 'model_6', 'model_5', 'model_9' ],
  [ 'model_3', 'model_7', 'model_2', 'model_6', 'model_9' ],
  [ 'model_5', 'model_3', 'model_6', 'model_9', 'model_8' ],
  [ 'model_4', 'model_5', 'model_10', 'model_1', 'model_8' ],
  [ 'model_5', 'model_4', 'model_10', 'model_3', 'model_2' ],
  [ 'model_2', 'model_3', 'model_4', 'model_8', 'model_7' ]
]

# KNN attack
# all_winners = [
#     [ 'model_8', 'model_9', 'model_7', 'model_10', 'model_3' ],
#   [ 'model_9', 'model_7', 'model_8', 'model_10', 'model_3' ],
#   [ 'model_4', 'model_9', 'model_7', 'model_10', 'model_5' ],
#   [ 'model_5', 'model_3', 'model_2', 'model_10', 'model_7' ],
#   [ 'model_3', 'model_2', 'model_8', 'model_10', 'model_5' ],
#   [ 'model_2', 'model_5', 'model_8', 'model_7', 'model_3' ],
#   [ 'model_4', 'model_10', 'model_3', 'model_7', 'model_5' ],
#   [ 'model_4', 'model_7', 'model_3', 'model_5', 'model_2' ],
#   [ 'model_4', 'model_2', 'model_7', 'model_3', 'model_5' ],
#   [ 'model_2', 'model_7', 'model_3', 'model_10', 'model_8' ],
#   [ 'model_8', 'model_10', 'model_9', 'model_2', 'model_5' ],
#   [ 'model_5', 'model_7', 'model_3', 'model_2', 'model_8' ],
#   [ 'model_4', 'model_2', 'model_5', 'model_9', 'model_3' ],
#   [ 'model_4', 'model_9', 'model_5', 'model_7', 'model_3' ],
#   [ 'model_4', 'model_2', 'model_5', 'model_3', 'model_9' ],
#   [ 'model_7', 'model_10', 'model_8', 'model_4', 'model_2' ],
#   [ 'model_3', 'model_10', 'model_5', 'model_4', 'model_2' ],
#   [ 'model_3', 'model_4', 'model_9', 'model_5', 'model_2' ],
#   [ 'model_9', 'model_3', 'model_7', 'model_8', 'model_2' ],
#   [ 'model_4', 'model_2', 'model_3', 'model_7', 'model_9' ]
# ]

rewards = [
    {
        "amount": 45.148500000000006,
        "id": "miner_1"
    },
    {
        "amount": 42.5756,
        "id": "miner_2"
    },
    {
        "amount": 65.5596,
        "id": "miner_3"
    },
    {
        "amount": 53.4674,
        "id": "miner_4"
    },
    {
        "amount": 57.7443,
        "id": "miner_5"
    },
    {
        "amount": 72.6617,
        "id": "miner_6"
    },
    {
        "amount": 82.10069999999999,
        "id": "miner_7"
    },
    {
        "amount": 131.4106,
        "id": "miner_8"
    },
    {
        "amount": 75.2451,
        "id": "miner_9"
    },
    {
        "amount": 72.8543,
        "id": "miner_10"
    }
]


def winners_rounds():
    models = {}
    for i in range(1, 11):
        models[f"model_{str(i)}"] = []

    for i in range(len(all_winners)):
        for winner in all_winners[i]:
            models[winner].append(i+1)
    
    for i in range(0, 10):
        if i > 4:
            plt.scatter(models[f"model_{str(10 - i)}"], [f"model {str(10 - i)}" for _ in range(len(models[f"model_{str(10 - i)}"]))], c=(0, 0, 1, 0.6))
        else:
            plt.scatter(models[f"model_{str(10 - i)}"], [f"model {str(10 - i)}" for _ in range(len(models[f"model_{str(10 - i)}"]))], c=(1, 0, 0, 0.6))
    plt.xticks(range(1, 21))
    plt.xlabel("Rounds")
    plt.ylabel("Models")
    plt.show()

def winners_models():
    models = {}
    for i in range(1, 11):
        models[f"model_{str(i)}"] = 0

    for rounds in all_winners:
        for winner in rounds:
            models[winner] += 1

    fig, axs = plt.subplots(3, 1)

    for i in range(1, 11):
        if i > 5:
            bar = axs[2].bar(i - 1, round(rewards[i-1]['amount'], 2), width=0.4, label=f"model_{str(i)}", color=(1, 0, 0, 0.6))
            axs[2].bar_label(bar)
        else:
            bar = axs[2].bar(i - 1, round(rewards[i-1]['amount'], 2), width=0.4, label=f"model_{str(i)}", color=(0, 0, 1, 0.6))
            axs[2].bar_label(bar)
    axs[2].set_xticks(range(10), [f"{str(i)}" for i in range(1, 11)])
    axs[2].set_yticks([20 * i for i in range(9)], [20 * i for i in range(9)])
    axs[2].set_title("Reward Distribution Between Different Miners.")
    axs[2].set_xlabel("Miners")
    axs[2].set_ylabel("Reward")

    for i in range(1, 11):
        # if i == 6 or i == 1:
        if i > 5:
            bar = axs[1].bar((i - 1), models[f"model_{str(i)}"], width=0.4, label=f"model_{str(i)}", color=(1, 0, 0, 0.6))
            axs[1].bar_label(bar)
        else:
            bar = axs[1].bar((i - 1), models[f"model_{str(i)}"], width=0.4, label=f"model_{str(i)}", color=(0, 0, 1, 0.6))
            axs[1].bar_label(bar)
    axs[1].set_xticks(range(10), [f"{str(i)}" for i in range(1, 11)])
    axs[1].set_yticks([0, 5, 10, 15, 20], [0, 5, 10, 15, 20])
    axs[1].set_ylabel("Number of Winning Rounds")
    # axs[1].set_xlabel("Miners")
    axs[1].set_title("Winner Distribution Between Different Miners")

    for i in range(1, 11):
        # if i == 6 or i == 1:
        if i > 5:
            bar = axs[0].bar(i - 1, (((i - 1) // 5) * 3 + 1) / 25, width=0.4, label=f"model_{str(i)}", color=(1, 0, 0, 0.6))
            axs[0].bar_label(bar)
        else:
            bar = axs[0].bar(i - 1, (((i - 1) // 5) * 3 + 1) / 25, width=0.4, label=f"model_{str(i)}", color=(0, 0, 1, 0.6))
            axs[0].bar_label(bar)
    axs[0].set_xticks(range(10), [f"{str(i)}" for i in range(1, 11)])
    axs[0].set_yticks([0.0, 0.05, 0.1, 0.15, 0.2], [0.0, 0.05, 0.1, 0.15, 0.2])
    axs[0].set_ylabel("Data Percentage")
    axs[0].set_title("Data Distribution Between Different Miners")
    plt.show()

winners_models()
winners_rounds()