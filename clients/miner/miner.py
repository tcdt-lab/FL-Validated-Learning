import requests
import json
import tensorflow as tf
from flask import Flask, request
import time
import datetime
import concurrent.futures
import random
import hashlib
import numpy as np
from functools import cmp_to_key

class TimerCallback(tf.keras.callbacks.Callback):
    def __init__(self, deadline):
        super().__init__()
        self.deadline = deadline
    # TODO: test this.
    # Checks whether the miner has time to train or not. if not it stops the training and sends the model to the ledger.
    def on_epoch_end(self, epoch, logs=None):
        current_time = time.time() / 60
        if current_time > self.deadline:
            self.model.stop_training = True 


class Miner:
    def __init__(self, name, peer_port=3000):
        self.name = name
        self.max_trx = 2
        self.total_miners = 5
        self.test_size = 5
        self.peer_port = peer_port

    def get_transactions(self):
        # Gets assigned transactions from the demo ledger
        res = requests.post(f"http://localhost:3000/api/demo/transactions/assign/",
                            json={
                                "minerName": self.name,
                                "count": self.max_trx
                            })
        try:
            self.transactions = json.loads(res.content)['data']
        except:
            print("Not ready for assignment.")
            exit(1)

    def get_test_records(self):
        res = requests.get(f"http://localhost:{self.peer_port}/api/model/",
                            json={
                                "id" : "testRecords"
                            })
        self.test_records = json.loads(res.content)['testRecords']
        
    
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

        self.X_train = self.preprocess(self.X_train)
    
    def get_random_test(self):
        # returns random indexes of test data for evaluating other miners
        self.test_indexes = random.sample(range(len(self.y_test)), self.test_size)
        return self.X_test[self.test_indexes]
    
    def preprocess(self, imgs):
        imgs = imgs.astype("float64") / 255.0
        imgs = np.pad(imgs, ((0, 0), (2, 2), (2, 2)), constant_values=0.0)
        return np.expand_dims(imgs, -1)

    def get_predictions(self):
        res = requests.get(f"http://localhost:{self.peer_port}/api/preds/miner",
                            json={
                                "id" : f"model_{self.name[-1]}"
                            })
        self.predictions = json.loads(res.content)
    
    def custom_compare(self, a, b): 
        a, b = a[1], b[1]
        if (a[0] > b[0]) or ((a[0] == b[0]) and (a[1] < b[1])): 
            return 1
        if (a == b):
            return 0
        return -1

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

        self.model.fit(self.X_train, self.y_train, epochs=10, batch_size=32, callbacks=[TimerCallback(self.deadline)])

        self.current_model = f"./{self.name}_{datetime.datetime.now()}.h5"
        self.model.save(self.current_model)

        print("Model trained.")
        test_data = self.get_random_test()
        test_data = [data.tolist() for data in test_data]
        transaction_ids = [transaction["id"] for transaction in self.transactions]
        hash_value = hashlib.md5(open(self.current_model,'rb').read()).hexdigest()
        requests.post(f"http://localhost:{self.peer_port}/api/model/", json={
            "id" : f"model_{self.name[-1]}",
            "hash" : hash_value,
            "transactions" : transaction_ids,
            "testData" : test_data
        })
    
    def predict(self):
        self.get_test_records()
        
        predictions = {}
        for key in self.test_records.keys():
            if key[-1] != self.name[-1]:
                test_data = self.test_records[key]
                test_data = np.array(test_data)
                test_data = self.preprocess(test_data)
                prediction = self.model.predict(test_data)
                prediction = np.argmax(prediction, axis=1).tolist()
                predictions[key] = prediction
        requests.post(f"http://localhost:{self.peer_port}/api/pred/", json={
            "id" : f"pred_{self.name[-1]}",
            "predictions" : predictions
        })
    
    def vote(self):
        self.get_predictions()
        labels = self.y_test[self.test_indexes]
        metrics = {}
        for key in self.predictions.keys():
            pred = np.array(self.predictions[key]['prediction'])
            acc = (pred == labels).sum() / len(labels)
            dt = datetime.datetime.fromisoformat(self.predictions[key]['time'][:-1])
            metrics[key] = (acc, dt)
        metrics = {k: v for k, v in sorted(metrics.items(), key=cmp_to_key(self.custom_compare), reverse=True)}
        votes = [f"model_{key[-1]}" for key in metrics.keys()]
        requests.post(f"http://localhost:{self.peer_port}/api/vote/", json={
            "id" : f"vote_{self.name[-1]}",
            "votes" : votes
        })