import requests

# Express Apps
try:
    requests.get("http://localhost:3000/exit/")
except:
    print("App1 could not be stopped.")

try:
    requests.get("http://localhost:3001/exit/")
except:
    print("App2 could not be stopped.")

# Miners
try:
    requests.get("http://localhost:8000/exit/")
except:
    print("Miner1 could not be stopped.")
try:
    requests.get("http://localhost:8001/exit/")
except:
    print("Miner1 could not be stopped.")
try:
    requests.get("http://localhost:8002/exit/")
except:
    print("Miner1 could not be stopped.")
try:
    requests.get("http://localhost:8003/exit/")
except:
    print("Miner1 could not be stopped.")

# Aggregator
try:
    requests.get("http://localhost:5050/exit/")
except:
    print("Aggregator could not be stopped.")

# Submitter
try:
    requests.get("http://localhost:6060/exit/")
except:
    print("Submitter could not be stopped.")