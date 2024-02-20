import tensorflow as tf

model = tf.keras.models.Sequential()
model.add(tf.keras.layers.InputLayer(input_shape=(28, 28,)))
model.add(tf.keras.layers.Flatten())
model.add(tf.keras.layers.Dense(100, activation='relu'))
model.add(tf.keras.layers.Dense(100, activation='relu'))
model.add(tf.keras.layers.Dense(10, activation='softmax'))

model.save('./global_model.h5')