import requests
import json
import tensorflow as tf
from flask import Flask, request
import time
import datetime
import concurrent.futures
import random
import hashlib

class TimerCallback(tf.keras.callbacks.Callback):
    # Checks whether the miner has time to train or not. if not it stops the training and sends the model to the ledger.
    def on_epoch_end(self, epoch, logs=None):
        current_time = time.time() / 60
        if current_time > miner.deadline:
            self.model.stop_training = True 


class Miner:
    def __init__(self, name):
        self.name = name
        self.max_trx = 2
        self.total_miners = 5
        self.test_size = 5

    def get_transactions(self):
        # Gets assigned transactions from the demo ledger
        res = requests.post("http://localhost:3000/api/demo/transactions/assign/",
                            json={
                                "minerName": self.name,
                                "count": self.max_trx
                            })
        try:
            self.transactions = json.loads(res.content)['data']
        except:
            print("Not ready for assignment.")
            exit(1)
        print(self.transactions)
    
    def get_global_model(self):
        # Gets the global model
        self.model = tf.keras.models.load_model("../global model/global_model.h5")
    
    def get_data(self):
        # Downloads the fashion mnist data and takes the part assigned to it as data.
        (X_train, y_train), (X_test, y_test) = tf.keras.datasets.fashion_mnist.load_data()
        k = int(self.name[-1]) - 1
        train_size = len(y_train) // self.total_miners
        test_size = len(y_test) // self.total_miners
        self.X_train, self.y_train = X_train[k*train_size:(k + 1)*train_size], y_train[k*train_size:(k + 1)*train_size]
        self.X_test, self.y_test = X_test[k*test_size:(k + 1)*test_size], y_test[k*test_size:(k + 1)*test_size]
    
    def get_random_test(self):
        # returns random indexes of test data for evaluating other miners
        self.test_indexes = random.sample(range(len(self.y_test)), self.test_size)
        return self.X_test[self.test_indexes]


    def train(self):
        # Complete flow of the training step
        # Getting Transactions
        # Getting the global model
        # Training the global model
        # Creating a model propose block
        # Sending the block to the demo ledger

        self.get_transactions()
        self.get_global_model()

        self.model.compile(loss="sparse_categorical_crossentropy",
              optimizer="adam",
              metrics=["accuracy"])
        
        self.X_train = self.X_train / 255

        self.model.fit(self.X_train, self.y_train, epochs=20, batch_size=32, callbacks=[TimerCallback()])

        self.current_model = f"./model_1_{datetime.datetime.now()}.h5"
        self.model.save(self.current_model)

        print("Model trained.")
        test_data = self.get_random_test()
        test_data = [data.tolist() for data in test_data]
        transaction_ids = [transaction["id"] for transaction in self.transactions]
        hash_value = hashlib.md5(open(self.current_model,'rb').read()).hexdigest()
        requests.post("http://localhost:3000/api/model/", json={
            "id" : f"model_{self.name[-1]}",
            "hash" : hash_value,
            "transactions" : transaction_ids,
            "testData" : test_data
        })
        
    
miner = Miner("miner_1")
miner.get_data()
executer = concurrent.futures.ThreadPoolExecutor(2)
app = Flask(__name__)

@app.route("/transactions/ready/")
def hello_world():
    # Handles HTTP requests for starting the training step
    deadline = request.args.get('time')
    miner.deadline = (time.time() / 60) + int(deadline) - 0.5
    executer.submit(miner.train)
    return "training started."

if __name__ == '__main__':
    app.run(host="localhost", port=8000, debug=True)
