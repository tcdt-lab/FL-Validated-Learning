import requests
import time
import random
import time
from flask import Flask
import threading
import os
import signal

"""
Submits a transfer transaction every second using random variables.
"""

app = Flask(__name__)

@app.route('/exit/')
def hello_world():
    os.kill(os.getpid(), signal.SIGTERM)

def flask_thread():
    app.run(port=6060)

def get_random_ids():
    id_1 = random.randint(1, 10)
    id_2 = random.randint(1, 10)
    while id_1 == id_2:
        id_2 = random.randint(1, 10)
    return id_1, id_2

def send_transactions():
    counter = 0
    while True:
        sender_id, receiver_id = get_random_ids()
        data = {
            "senderId" : f'main_{sender_id}',
            "receiverId" : f'main_{receiver_id}',
            "amount" : round(random.random() * 0.4, 2)
        }
        _ = requests.post("http://localhost:3001/api/demo/transaction/transfer/", json=data)
        print(f"Transaction demo_{counter} submitted.")
        counter += 1
        time.sleep(20)

if __name__ == '__main__':
    # Create the Flask thread
    flask_thread = threading.Thread(target=flask_thread)

    # Create the loop function thread
    loop_function_thread = threading.Thread(target=send_transactions)

    # Start both threads
    flask_thread.start()
    loop_function_thread.start()

    # Wait for both threads to finish (this won't happen in this example)
    flask_thread.join()
    loop_function_thread.join()

