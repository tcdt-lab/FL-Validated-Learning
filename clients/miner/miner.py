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
    """
    Stops miner training right before the training deadline.
    """

    def __init__(self, deadline):
        super().__init__()
        self.deadline = deadline


    def on_epoch_end(self, epoch, logs=None):
        current_time = time.time()
        if current_time > self.deadline:
            self.model.stop_training = True 
        print(f"Epoch {epoch} completed.")


class Miner:
    def __init__(self, name, peer_port=3000):
        """
        Defines the functionalities of miners.
        
        max_trx : the maximum number of transaction each miner can mine per round.
        peer_port : the port on which the peer's express application is running.
        data_sizes : the percentage of data available for each miner. This is saved
                    in a list in which each index corresponds to the data size of 
                    the respective miner.
        """
        self.name = name

        self.max_trx = 2
        self.total_miners = 10
        self.test_size = 50
        self.random_state = 97

        self.peer_port = peer_port
        self.round = 0

        # self.data_sizes = [(10 - i) / 55 for i in range(10)] # Option 1
        self.data_sizes = [((i // 5) * 3 + 1) / 25 for i in range(10)] # Option 2
    

    def get_transactions(self):
        """
        Asks the admin peer for transactions to mine.
        """

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
        """
        Sends a request to an express application to receive test records for prediction.
        """

        res = requests.get(f"http://localhost:{self.peer_port}/api/model/",
                            json={
                                "id" : "testRecords"
                            })
        self.test_records = json.loads(res.content)['testRecords']
        
    
    def get_global_model(self):
        """
        Loads the current global model.
        """

        self.model = tf.keras.models.load_model("../global model/global_model.keras")


    def softmax(self, array):
        array = np.array(array)
        array = np.exp(array) / np.sum(np.exp(array))
    

    def get_data(self):
        """
        Downloads the CIFAR10 data and takes the part assigned to it as data
        """

        (X_train, y_train), (X_test, y_test) = tf.keras.datasets.cifar10.load_data()
        X_train, y_train = shuffle(X_train, y_train, random_state=self.random_state)
        X_test, y_test = shuffle(X_test, y_test, random_state=self.random_state)
        k = int(self.name[6:]) - 1

        start_index = sum(self.data_sizes[:k])
        end_index = start_index + self.data_sizes[k]
        self.X_train, self.y_train = X_train[int(start_index*len(y_train)):int(end_index*len(y_train))], y_train[int(start_index*len(y_train)):int(end_index*len(y_train))]
        self.X_test, self.y_test = X_test[int(start_index*len(y_test)):int(end_index*len(y_test))], y_test[int(start_index*len(y_test)):int(end_index*len(y_test))]

        self.X_train = self.preprocess(self.X_train)
    

    def get_random_test(self):
        """
        Returns random indexes of test data for evaluating other miners.
        """

        if len(self.y_test) < self.test_size:
            self.test_indexes = list(range(len(self.y_test)))
            return self.X_test
        self.test_indexes = random.sample(range(len(self.y_test)), self.test_size)

        return self.X_test[self.test_indexes, :]
    

    def preprocess(self, imgs):
        """
        Preprocesses the given images for our CNN.
        """

        return imgs.astype("float64") / 255.0


    def get_predictions(self):
        """
        Receives the predictions of other models for voting
        """

        res = requests.get(f"http://localhost:{self.peer_port}/api/preds/miner",
                            json={
                                "id" : f"model_{self.name[6:]}"
                            })
        self.predictions = json.loads(res.content)
    

    def custom_compare(self, a, b): 
        """
        A custom sorting function that first sorts predictions based on accuracy and in
        equal cases favors the faster miners.
        """

        a, b = a[1], b[1]
        if (a[0] > b[0]) or ((a[0] == b[0]) and (a[1] < b[1])): 
            return 1
        if (a == b):
            return 0
        return -1


    def train(self):
        """
        Training step implementation:
        1. Getting transactions to mine.
        2. Getting the current global model.
        3. Training the global model with local data right before overfit or deadline.
        4. Creating a model propose block.
        5. Sending the block to the demo ledger.
        """

        self.get_transactions()
        self.get_global_model()

        self.model.compile(loss="sparse_categorical_crossentropy",
              optimizer="adam",
              metrics=["accuracy"])

        print(f"Starting round {self.round}\n")
        early_stopping = tf.keras.callbacks.EarlyStopping(patience=5)
        history = self.model.fit(self.X_train, self.y_train, epochs=20, batch_size=32, 
                                 validation_data=(self.preprocess(self.X_test), self.y_test), 
                                 callbacks=[TimerCallback(self.deadline), early_stopping],
                                 verbose=0)
        print("\nLocal model is trained.")

        # Saving the trained local model and training history.
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
            "id" : f"model_{self.name[6:]}",
            "hash" : hash_value,
            "path" : self.current_model_path,
            "transactions" : transaction_ids,
            "testData" : test_data
        })
    

    def predict(self):
        """
        Predicts the test data of other models.
        """

        self.get_test_records()
        
        predictions = {}
        for key in self.test_records.keys():
            if key[6:] != self.name[6:]:
                test_data = self.test_records[key]
                test_data = np.array(test_data)
                test_data = self.preprocess(test_data)
                prediction = self.model.predict(test_data)
                prediction = np.argmax(prediction, axis=1).tolist()
                predictions[key] = prediction
        
        requests.post(f"http://localhost:{self.peer_port}/api/pred/", json={
            "id" : f"pred_{self.name[6:]}",
            "predictions" : predictions
        })
    
    def vote(self):
        """
        Votes the predictions of other miners
        """

        self.get_predictions()

        labels = self.y_test[self.test_indexes]
        metrics = {}
        for key in self.predictions.keys():
            pred = np.array(self.predictions[key]['prediction'])
            pred = np.expand_dims(pred, axis=-1)
            acc = ((pred == labels).sum()) / len(labels)
            dt = datetime.datetime.fromisoformat(self.predictions[key]['time'][:-1])
            key_num = key.split("_")[1]
            metrics[f"model_{key_num}"] = (acc, dt)
        metrics = {k: v for k, v in sorted(metrics.items(), key=cmp_to_key(self.custom_compare), reverse=True)}

        requests.post(f"http://localhost:{self.peer_port}/api/vote/", json={
            "id" : f"vote_{self.name[6:]}",
            "votes" : list(metrics.keys())
        })
        print(f"My vote is {list(metrics.keys())}.\n")