import tensorflow as tf
import numpy as np
import hashlib

models = [{'hash': '91c96a7c41cdde0a6b3f69d28c304b94', 
           'path': '/Users/amirrezasokhankhosh/Documents/Workstation/FL_Consensus/clients/miner/miner_1_2024-02-21 16:38:25.453288.h5'}, 
           {'hash': 'a7b3b79169d6b43d61302024d116c930', 
            'path': '/Users/amirrezasokhankhosh/Documents/Workstation/FL_Consensus/clients/miner/miner_2_2024-02-21 16:38:25.106863.h5'}]

global_model = tf.keras.models.load_model("../global model/global_model.h5")
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
# global_model.save("../global model/global_model.h5")