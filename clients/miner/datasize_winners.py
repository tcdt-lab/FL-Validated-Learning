"""
To observe the relationship between data size and winning, first run the whole network using your desired
data distribution. Then, copy the winners printed at the end of app1.txt to "all_winners" below. Run this 
file to get the plot.
"""

import matplotlib.pyplot as plt

all_winners = [
  [ 'model_8', 'model_9', 'model_7', 'model_10', 'model_3' ],
  [ 'model_9', 'model_7', 'model_8', 'model_10', 'model_3' ],
  [ 'model_4', 'model_9', 'model_7', 'model_10', 'model_5' ],
  [ 'model_5', 'model_3', 'model_2', 'model_10', 'model_7' ],
  [ 'model_3', 'model_2', 'model_8', 'model_10', 'model_5' ],
  [ 'model_2', 'model_5', 'model_8', 'model_7', 'model_3' ],
  [ 'model_4', 'model_10', 'model_3', 'model_7', 'model_5' ],
  [ 'model_4', 'model_7', 'model_3', 'model_5', 'model_2' ],
  [ 'model_4', 'model_2', 'model_7', 'model_3', 'model_5' ],
  [ 'model_2', 'model_7', 'model_3', 'model_10', 'model_8' ],
  [ 'model_8', 'model_10', 'model_9', 'model_2', 'model_5' ],
  [ 'model_5', 'model_7', 'model_3', 'model_2', 'model_8' ],
  [ 'model_4', 'model_2', 'model_5', 'model_9', 'model_3' ],
  [ 'model_4', 'model_9', 'model_5', 'model_7', 'model_3' ],
  [ 'model_4', 'model_2', 'model_5', 'model_3', 'model_9' ],
  [ 'model_7', 'model_10', 'model_8', 'model_4', 'model_2' ],
  [ 'model_3', 'model_10', 'model_5', 'model_4', 'model_2' ],
  [ 'model_3', 'model_4', 'model_9', 'model_5', 'model_2' ],
  [ 'model_9', 'model_3', 'model_7', 'model_8', 'model_2' ],
  [ 'model_4', 'model_2', 'model_3', 'model_7', 'model_9' ]
]

models = {}
for i in range(1, 11):
    models[f"model_{str(i)}"] = 0

for rounds in all_winners:
    for winner in rounds:
        models[winner] += 1

fig, axs = plt.subplots(2, 1)

for i in range(1, 11):
    bar = axs[1].bar(i - 1, models[f"model_{str(i)}"], width=0.3, label=f"model_{str(i)}")
    axs[1].bar_label(bar)
axs[1].set_xticks(range(10), [f"model {str(i)}" for i in range(1, 11)])
axs[1].set_title("Winner distribution Between Different Miners.")

for i in range(1, 11):
    bar = axs[0].bar(i - 1, (((i-1) // 5) * 3 + 1) / 25, width=0.3, label=f"model_{str(i)}")
    axs[0].bar_label(bar)
axs[0].set_xticks(range(10), [f"data {str(i)}" for i in range(1, 11)])
axs[0].set_title("Data distribution Between Different Miners.")
plt.show()
