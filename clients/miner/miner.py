import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="tensorflow")

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
import os
import matplotlib.pyplot as plt
import signal
from sklearn.utils import shuffle

class TimerCallback(tf.keras.callbacks.Callback):
    def __init__(self, deadline):
        super().__init__()
        self.deadline = deadline
    # TODO: test this.
    # Checks whether the miner has time to train or not. if not it stops the training and sends the model to the ledger.
    def on_epoch_end(self, epoch, logs=None):
        current_time = time.time()
        if current_time > self.deadline:
            self.model.stop_training = True 
        print(f"Epoch {epoch} completed.")


class Miner:
    def __init__(self, name, peer_port=3000):
        self.name = name
        self.max_trx = 2
        self.total_miners = 10
        self.test_size = 50
        self.peer_port = peer_port
        self.round = 0
        self.data_sizes = [0.05, 0.1, 0.15, 0.25, 0.05, 0.05, 0.05, 0.15, 0.1, 0.05]
        self.data_sizes = [(10 - i) / 55 for i in range(10)]
        self.training = False

    def get_transactions(self):
        # Gets assigned transactions from the demo ledger
        res = requests.post(f"http://localhost:3000/api/demo/transactions/assign/",
                            json={
                                "minerName": self.name,
                                "count": self.max_trx
                            })
        try:
            self.transactions = json.loads(res.content)['data']
            self.training = True
        except:
            print("Not ready for assignment.")
            self.training = False
            exit(1)

    def get_test_records(self):
        res = requests.get(f"http://localhost:{self.peer_port}/api/model/",
                            json={
                                "id" : "testRecords"
                            })
        self.test_records = json.loads(res.content)['testRecords']
        
    
    def get_global_model(self):
        # Gets the global model
        self.model = tf.keras.models.load_model("../global model/global_model.keras")

    def softmax(self, array):
        array = np.array(array)
        array = np.exp(array) / np.sum(np.exp(array))

    
    def get_data(self):
        # Downloads the fashion mnist data and takes the part assigned to it as data.
        (X_train, y_train), (X_test, y_test) = tf.keras.datasets.cifar10.load_data()
        X_train, y_train = shuffle(X_train, y_train)
        X_test, y_test = shuffle(X_test, y_test)
        k = int(self.name[-1]) - 1
        # train_size = len(y_train) // self.total_miners
        # test_size = len(y_test) // self.total_miners
        # self.X_train, self.y_train = X_train[k*train_size:(k + 1)*train_size], y_train[k*train_size:(k + 1)*train_size]
        # self.X_test, self.y_test = X_test[k*test_size:(k + 1)*test_size], y_test[k*test_size:(k + 1)*test_size]

        start_index = sum(self.data_sizes[:k])
        end_index = start_index + self.data_sizes[k]
        self.X_train, self.y_train = X_train[int(start_index*len(y_train)):int(end_index*len(y_train))], y_train[int(start_index*len(y_train)):int(end_index*len(y_train))]
        self.X_test, self.y_test = X_test[int(start_index*len(y_test)):int(end_index*len(y_test))], y_test[int(start_index*len(y_test)):int(end_index*len(y_test))]

        self.X_train = self.preprocess(self.X_train)
    
    def get_random_test(self):
        # returns random indexes of test data for evaluating other miners
        if len(self.y_test) < self.test_size:
            self.test_indexes = list(range(len(self.y_test)))
            return self.X_test
        self.test_indexes = random.sample(range(len(self.y_test)), self.test_size)
        return self.X_test[self.test_indexes, :]
    
    def preprocess(self, imgs):
        return imgs.astype("float64") / 255.0

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

        print(f"Starting round {self.round}")
        early_stopping = tf.keras.callbacks.EarlyStopping(patience=5)
        history = self.model.fit(self.X_train, self.y_train, epochs=20, batch_size=32, 
                                 validation_data=(self.preprocess(self.X_test), self.y_test), 
                                 callbacks=[TimerCallback(self.deadline), early_stopping],
                                 verbose=0)
        print("Local model is trained.")

        current_name = f"{self.name}_round_{self.round}"
        self.current_model = f"./results/{current_name}.keras"
        json.dump(history.history, open(f"./results/{current_name}.json", 'w'))

        self.model.save(self.current_model)

        cwd = os.path.dirname(__file__)
        self.current_model_path = os.path.abspath(os.path.join(cwd, self.current_model))

        test_data = self.get_random_test()
        test_data = [data.tolist() for data in test_data]
        transaction_ids = [transaction["id"] for transaction in self.transactions]
        hash_value = hashlib.md5(open(self.current_model,'rb').read()).hexdigest()
        requests.post(f"http://localhost:{self.peer_port}/api/model/", json={
            "id" : f"model_{self.name[-1]}",
            "hash" : hash_value,
            "path" : self.current_model_path,
            "transactions" : transaction_ids,
            "testData" : test_data
        })
    
    def predict(self):
        if self.training:
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
        if self.training:
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
            print(f"My vote is {votes}.")