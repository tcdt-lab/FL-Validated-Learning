import os
import concurrent.futures
import requests
import random
import time


def get_random_ids():
    id_1 = random.randint(1, 10)
    id_2 = random.randint(1, 10)
    while id_1 == id_2:
        id_2 = random.randint(1, 10)
    return id_1, id_2

def send_trx(count):
    for i in range(count):
        sender_id, receiver_id = get_random_ids()
        data = {
            "senderId" : f'main_{sender_id}',
            "receiverId" : f'main_{receiver_id}',
            "amount" : round(random.random() * 0.4, 2)
        }
        _ = requests.post("http://localhost:3001/api/demo/transaction/transfer/", json=data)


if __name__ == "__main__":
    cwd = os.path.dirname(__file__)
    executor = concurrent.futures.ProcessPoolExecutor(14)

    # Step 1 : Bring up the network
    print("Bringing up the network...")
    os.chdir(os.path.join(cwd, "test-network"))
    os.system("./network.sh down")
    os.system("sh ./start.sh")  

    # Step 2 : Bring up express applications
    print("Bringing up the express applications...")
    os.chdir(os.path.join(cwd, "express-application"))
    executor.submit(os.system, "node ./app1.js > ../logs/app1.txt")
    time.sleep(3)
    executor.submit(os.system, "node ./app2.js > ../logs/app2.txt")
    time.sleep(3)

    # Step 3 : Bring up miners
    print("Bringing up the miners...")
    os.chdir(os.path.join(cwd, "clients", "miner"))
    for i in range(10):
        executor.submit(os.system, f"python3 ./miner{i+1}.py > ../../logs/miner{i+1}.txt")
        time.sleep(3)

    # Step 4 : Bring up Aggregator
    print("Bringing up the aggregator...")
    os.chdir(os.path.join(cwd, "clients", "aggregator"))
    executor.submit(os.system, "python3 ./aggregator.py > ../../logs/aggregator.txt")
    time.sleep(3)

    # Step 4 : Initialize ledgers
    os.chdir(os.path.join(cwd, "test-network"))
    os.system("sh ./req.sh")

    # Step 5 : Add some demo transactions
    print("Submitting demo transactions...")
    send_trx(20)

    # Step 6 : Bring up submitter
    print("Bringing up the submitter...")
    os.chdir(os.path.join(cwd, "clients", "submitter"))
    executor.submit(os.system, "python3 ./submitter.py > ../../logs/submitter.txt")
    time.sleep(3)

    # Step 7 : Re-initializing the model
    print("Re-initializing the global model...")
    os.chdir(os.path.join(cwd, "clients", "global model"))
    os.system("python3 ./model.py")
    time.sleep(3)

    # Step 8 : Sending start request
    print("Starting the mining process...")
    requests.post("http://localhost:3000/api/start/")