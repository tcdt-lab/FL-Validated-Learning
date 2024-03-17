from Miner import *


miner = Miner("miner_8", peer_port=3001)
miner.get_data()
executer = concurrent.futures.ThreadPoolExecutor(2)
app = Flask(__name__)

@app.route("/transactions/ready/")
def transactions():
    # Handles HTTP requests for starting the training step
    deadline = request.args.get('time')
    miner.round = request.args.get('round')
    miner.deadline = time.time() + float(deadline) - 30
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

@app.route("/exit/")
def exit_miner():
    os.kill(os.getpid(), signal.SIGTERM)

if __name__ == '__main__':
    app.run(host="localhost", port=8007)