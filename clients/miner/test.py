import tensorflow as tf
import numpy as np

(X_train, _), (_, _) = tf.keras.datasets.cifar10.load_data()

print(X_train.reshape(X_train.shape[0], -1).shape)