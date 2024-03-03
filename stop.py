import requests

# Express Apps
try:
    requests.get("http://localhost:3000/exit/")
except:
    print("App1 is stopped.")

try:
    requests.get("http://localhost:3001/exit/")
except:
    print("App2 is stopped.")

# Miners
try:
    requests.get("http://localhost:8000/exit/")
except:
    print("Miner1 is stopped.")
try:
    requests.get("http://localhost:8001/exit/")
except:
    print("Miner2 is stopped.")
try:
    requests.get("http://localhost:8002/exit/")
except:
    print("Miner3 is stopped.")
try:
    requests.get("http://localhost:8003/exit/")
except:
    print("Miner4 is stopped.")

# Aggregator
try:
    requests.get("http://localhost:5050/exit/")
except:
    print("Aggregator is stopped.")

# Submitter
try:
    requests.get("http://localhost:6060/exit/")
except:
    print("Submitter is stopped.")