import tensorflow as tf

# Build the model
input_classifer = tf.keras.layers.Input((32, 32, 1), name="input_classifier")
x = tf.keras.layers.Conv2D(8, (3, 3), strides=2, padding="same", activation="relu")(input_classifer)
x = tf.keras.layers.Conv2D(32, (3, 3), strides=2, padding="same", activation="relu")(x)
x = tf.keras.layers.Conv2D(128, (3, 3), strides=2, padding="same", activation="relu")(x)
x = tf.keras.layers.Flatten()(x)
output_classifier = tf.keras.layers.Dense(10, activation="softmax", name="output_classifier")(x)

classifier = tf.keras.models.Model(input_classifer, output_classifier)

classifier.save("./global_model.h5")