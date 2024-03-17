import json
import matplotlib.pyplot as plt


num_miners = 5
num_rounds = 20
fig, axes = plt.subplots(2, num_miners)



for i in range(num_miners):
    loss_len = 0
    val_loss_len = 0
    acc_len = 0
    val_acc_len = 0
    for j in range(num_rounds):
        filename = f"./results/miner_{i+6}_round_{j+1}.json"
        history = json.load(open(filename, 'r'))
        # axes[0, i].plot(range(loss_len, loss_len + len(history['loss'])), history['loss'])
        # axes[0, i].scatter(range(loss_len, loss_len + len(history['loss'])), history['loss'])
        axes[0, i].plot(range(val_loss_len, val_loss_len + len(history['val_loss'])), history['val_loss'])
        # axes[0, i].scatter(range(val_loss_len, val_loss_len + len(history['val_loss'])), history['val_loss'])
        # axes[2, i].plot(range(acc_len, acc_len + len(history['accuracy'])), history['accuracy'])
        # axes[2, i].scatter(range(acc_len, acc_len + len(history['accuracy'])), history['accuracy'])
        axes[1, i].plot(range(val_acc_len, val_acc_len + len(history['val_accuracy'])), history['val_accuracy'])
        # axes[1, i].scatter(range(val_acc_len, val_acc_len + len(history['val_accuracy'])), history['val_accuracy'])
        # loss_len += len(history['loss'])
        val_loss_len += len(history['val_loss'])
        # acc_len += len(history['accuracy'])
        val_acc_len += len(history['val_accuracy'])

# axes[0, 0].set_ylabel("Training loss")
axes[0, 0].set_ylabel("Validation loss")
# axes[2, 0].set_ylabel("Training accuracy")
axes[1, 0].set_ylabel("Validation accuracy")

for i in range(num_miners):
    axes[0, i].set_title(f"Miner {i+6}")

plt.show()

