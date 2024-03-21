"""
To observe the training results, change the value of "metric" to your desired metric and run the function below.
"""

import json
import matplotlib.pyplot as plt


def display_training_results(metric, ylabel):
    fig = plt.figure()
    gs = fig.add_gridspec(num_rows, num_miners // num_rows, wspace=0)
    axes = gs.subplots(sharex=True, sharey=True)

    for i in range(num_miners):
        loss_len = 0
        val_loss_len = 0
        acc_len = 0
        val_acc_len = 0
        for j in range(num_rounds):
            filename = f"./results/miner_{i+1}_round_{j+1}.json"
            history = json.load(open(filename, 'r'))
            axes[i // 5, i - (i // 5) * 5].plot(range(val_loss_len, val_loss_len + len(history[metric])), history[metric])
            loss_len += len(history['loss'])
            val_loss_len += len(history['val_loss'])
            acc_len += len(history['accuracy'])
            val_acc_len += len(history['val_accuracy'])

    for i in range(num_rows):
        axes[i, 0].set_ylabel(ylabel)

    for i in range(num_miners):
        axes[i // 5, i - (i // 5) * 5].set_title(f"Miner {i+1}")

    plt.show()


num_miners = 10
num_rounds = 20
num_rows = 2


display_training_results("val_loss", "Validation Loss")
display_training_results("val_accuracy", "Validation Accuracy")

display_training_results("loss", "Training Loss")
display_training_results("accuracy", "Training Accuracy")
