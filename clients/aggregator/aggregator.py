"""
Updates the global model by setting its parameters to the mean of the winner models parameters.
"""

from flask import Flask, request
import concurrent.futures
import hashlib
import tensorflow as tf
import numpy as np
import os
import signal


executer = concurrent.futures.ThreadPoolExecutor(2)
app = Flask(__name__)


def aggregate_weights(models):
    global_model = tf.keras.models.load_model("../global model/global_model.keras")
    layers = global_model.get_weights()
    new_layers = [np.zeros_like(layer) for layer in layers]
    count = 0
    for model in models:
        hash_value = hashlib.md5(open(model['path'],'rb').read()).hexdigest()
        if hash_value == model['hash']:
            local_model = tf.keras.models.load_model(model['path'])
            local_layers = local_model.get_weights()
            for i in range(len(new_layers)):
                new_layers[i] = new_layers[i] + local_layers[i]
            count += 1
    for i in range(len(new_layers)):
        new_layers[i] = new_layers[i] / count
    global_model.set_weights(new_layers)
    global_model.save("../global model/global_model.keras")
    print("Global model is successfully updated.")


@app.route("/aggregate/", methods=['POST'])
def aggregate():
    models = request.get_json()["models"]
    executer.submit(aggregate_weights, models)
    return "aggregation started."

@app.route("/exit/")
def exit_aggregator():
    os.kill(os.getpid(), signal.SIGTERM)

if __name__ == '__main__':
    app.run(host="localhost", port=5050, debug=True)
