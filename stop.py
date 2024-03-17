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
for i in range(10):
    try:
        requests.get(f"http://localhost:{8000 + i}/exit/")
    except:
        print(f"Miner{i+1} is stopped.")

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