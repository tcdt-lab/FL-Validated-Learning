import requests
import json
import tensorflow as tf


class Miner:
    def __init__(self, name):
        self.name = name
        self.max_trx = 2
        self.total_miners = 5

    def get_transactions(self):
        res = requests.post("http://localhost:3001/api/demo/transactions/assign/",
                            json={
                                "minerName": self.name,
                                "count": self.max_trx
                            })
        self.transactions = json.loads(res.content).data
    
    def get_global_model(self):
        self.model = tf.keras.models.load_model("../global model/global_model.h5")
    
    def get_data(self):
        (X_train, y_train), (X_test, y_test) = tf.keras.datasets.fashion_mnist.load_data()
        k = int(self.name[-1]) - 1
        train_size = len(y_train) // self.total_miners
        test_size = len(y_test) // self.total_miners
        self.X_train, self.y_train = X_train[k*train_size:(k + 1)*train_size], y_train[k*train_size:(k + 1)*train_size]
        self.X_test, self.y_test = X_test[k*test_size:(k + 1)*test_size], y_test[k*test_size:(k + 1)*test_size]

    


miner = Miner("miner_1")
miner.get_data()
print(miner.X_train.shape)
print(miner.y_train.shape)
print(miner.X_test.shape)
print(miner.y_test.shape)
