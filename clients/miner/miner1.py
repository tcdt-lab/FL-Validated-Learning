from Miner import *


miner = Miner("miner_1")
miner.get_data()
executer = concurrent.futures.ThreadPoolExecutor(2)
app = Flask(__name__)

@app.route("/transactions/ready/")
def transactions():
    deadline = request.args.get('time')
    miner.round = request.args.get('round')
    miner.deadline = time.time() + float(deadline) - 30
    executer.submit(miner.train)
    return "training started."

@app.route("/tests/ready/")
def tests():
    executer.submit(miner.predict)
    return "Prediction started."

@app.route("/preds/ready/")
def preds():
    executer.submit(miner.vote)
    return "Voting started"

@app.route("/exit/")
def exit_miner():
    os.kill(os.getpid(), signal.SIGTERM)

if __name__ == '__main__':
    app.run(host="localhost", port=8000)
