from Miner import *


miner = Miner("miner_1")
miner.get_data()
executer = concurrent.futures.ThreadPoolExecutor(2)
app = Flask(__name__)

@app.route("/transactions/ready/")
def transactions():
    # Handles HTTP requests for starting the training step
    deadline = request.args.get('time')
    miner.deadline = (time.time() / 60) + int(deadline) - 0.5
    executer.submit(miner.train)
    return "training started."

@app.route("/tests/ready/")
def tests():
    executer.submit(miner.predict)
    return "I am getting the tests."

@app.route("/preds/ready/")
def preds():
    executer.submit(miner.vote)
    # miner.vote()
    return "I am voting."

if __name__ == '__main__':
    app.run(host="localhost", port=8000, debug=True)
