import requests
import json
import time
import random

"""
Submits a transfer transaction every second using random variables.
"""

def get_random_ids():
    id_1 = random.randint(1, 10)
    id_2 = random.randint(1, 10)
    while id_1 == id_2:
        id_2 = random.randint(1, 10)
    return id_1, id_2

counter = 1

while True:
    sender_id, receiver_id = get_random_ids()
    data = {
        "senderId" : f'main_{sender_id}',
        "receiverId" : f'main_{receiver_id}',
        "amount" : round(random.random() * 0.4, 2)
    }
    res = requests.post("http://localhost:3001/api/demo/transaction/transfer/", json=data)
    print(f"Transaction demo_{counter} submitted.")
    counter += 1
    time.sleep(10)