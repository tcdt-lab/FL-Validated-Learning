import matplotlib.pyplot as plt

all_winners = [
  [ 'model_4', 'model_2', 'model_7', 'model_3', 'model_1' ],
  [ 'model_3', 'model_9', 'model_7', 'model_4', 'model_5' ],
  [ 'model_7', 'model_5', 'model_6', 'model_4', 'model_2' ],
  [ 'model_7', 'model_2', 'model_3', 'model_5', 'model_8' ],
  [ 'model_3', 'model_2', 'model_4', 'model_7', 'model_5' ],
  [ 'model_6', 'model_2', 'model_7', 'model_9', 'model_3' ],
  [ 'model_1', 'model_6', 'model_8', 'model_3', 'model_2' ],
  [ 'model_7', 'model_1', 'model_5', 'model_6', 'model_2' ],
  [ 'model_1', 'model_4', 'model_9', 'model_7', 'model_6' ],
  [ 'model_3', 'model_6', 'model_8', 'model_7', 'model_4' ],
  [ 'model_3', 'model_5', 'model_1', 'model_6', 'model_9' ],
  [ 'model_2', 'model_5', 'model_1', 'model_9', 'model_3' ],
  [ 'model_2', 'model_1', 'model_5', 'model_7', 'model_8' ],
  [ 'model_1', 'model_5', 'model_9', 'model_7', 'model_2' ],
  [ 'model_3', 'model_1', 'model_2', 'model_9', 'model_4' ],
  [ 'model_4', 'model_9', 'model_3', 'model_8', 'model_7' ],
  [ 'model_6', 'model_8', 'model_9', 'model_7', 'model_1' ],
  [ 'model_4', 'model_9', 'model_6', 'model_1', 'model_7' ],
  [ 'model_3', 'model_7', 'model_8', 'model_1', 'model_2' ],
  [ 'model_6', 'model_2', 'model_1', 'model_5', 'model_4' ]
]

# models = {}
# for i in range(1, 11):
#     models[f"model_{str(i)[-1]}"] = 0


models = {}
for i in range(1, 11):
    models[f"model_{str(i)[-1]}"] = []

for i in range(len(all_winners)):
    for winner in all_winners[i]:
        models[winner].append(i+1)

# for rounds in all_winners:
#     for winner in rounds:
#         models[winner] += 1
# print(models)

# fig, axs = plt.subplots(2, 1)

# for i in range(1, 11):
#     bar = axs[1].bar(i - 1, models[f"model_{str(i)[-1]}"], width=0.3, label=f"model_{str(i)[-1]}")
#     axs[1].bar_label(bar)

# axs[1].set_xticks(range(10), [f"model {str(i)[-1]}" for i in range(1, 11)])
# axs[1].set_title("Winner distribution Between Different Miners.")

# for i in range(1, 11):
#     bar = axs[0].bar(i - 1, round((11 - i) / 55, 4), width=0.3, label=f"model_{str(i)[-1]}")
#     axs[0].bar_label(bar)
# axs[0].set_xticks(range(10), [f"data {str(i)[-1]}" for i in range(1, 11)])
# axs[0].set_title("Data distribution Between Different Miners.")
# # axs[0].set_suptitle("Hello")
# plt.show()



for i in range(0, 10):
    plt.scatter(models[f"model_{str(10 - i)[-1]}"], [f"model_{str(10 - i)[-1]}" for _ in range(len(models[f"model_{str(10 - i)[-1]}"]))])
plt.xticks(range(1, 21))
plt.show()