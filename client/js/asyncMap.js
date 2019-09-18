//double buffering to do rendering to and switch when the rendering is done
//the buffer is a Map
class RenderBuffer {
  constructor() {
    this.buffers[0] = new Map();
    this.buffers[1] = new Map();
  }

  switchFrontBuffer() {
    console.log(this.currentBuffer);
    this.currentBuffer = Number(!Boolean(this.currentBuffer));
    console.log(this.currentBuffer);
  }

  clearBackBuffer() {
    this.buffers[Number(!Boolean(this.currentBuffer))].forEach((value, key) => {
      value.setMap(null);
    });
    this.buffers[Number(!Boolean(this.currentBuffer))].clear();
  }

  getBackBuffer() {
    return this.buffers[Number(!Boolean(this.currentBuffer))];
  }

  getFrontBuffer() {
    return this.buffers[this.currentBuffer];
  }

  buffers = [];
  currentBuffer = 0;
}

const work = {
  ZOOM: 0,
  NEW_DATA: 1
};

class JobTaskSystem {
  constructor() {
    //initialize workers
    for (var i = 0; i < navigator.hardwareConcurrency; i++) {
      this.workers[i] = new Worker("../js/worker.js");
      this.worker_ids[i] = i;
      this.availableWorkers.set(i, i);
      this.workers[i].onmessage = this.onMessageCallBack.bind(this);
    }
    //initialize workBackLog based on the work enum
    //therefore add new enums to work to allocate more backlogs
    var tmpValues = Object.values(work);
    for (var i = 0; i < tmpValues.length; i++) {
      this.workerBackLog[tmpValues[i]] = [];
    }
  }

  queueWork(typeOfWork, data) {
    if (!this.available) {
      if (typeOfWork == this.currentWork) {
        //no point in finishing this as the map was updated
        this.terminateWorkers();
        document.getElementById("computeProgressBar").style =
          "width:" + 0 + "%;";
        document.getElementById("computeProgressBar").innerHTML = "Processing";
        //execute the new computation based on the updated map
        for (var i = 0; i < navigator.hardwareConcurrency; i++) {
          this.sendWork(data, i);
        }
      } else {
        //clear the old cache as it is being updated
        this.workerBackLog[typeOfWork].clear();
        //cache the new work
        this.workerBackLog[typeOfWork].push(data);
      }
    } else {
      //set current work
      //do work
      this.currentWork = typeOfWork;
      document.getElementById("computeProgressBar").style = "width:" + 0 + "%;";
      document.getElementById("computeProgressBar").innerHTML = "Processing";
      for (var i = 0; i < navigator.hardwareConcurrency; i++) {
        this.sendWork(data, i);
      }
    }
  }

  //this keeps track of when all the threads are down
  onMessageCallBack(e) {
    this.availableWorkers.delete(e.data.worker_id);
    document.getElementById("computeProgressBar").style =
      "width:" +
      (100 -
        (this.availableWorkers.size / navigator.hardwareConcurrency) * 100) +
      "%;";
    if (this.availableWorkers.size == 0) {
      this.available = true;
      this.typeOfWork = null;
      delete e.data.worker_id;
      this.callback(e);
      this.onFinishedCallback();
      document.getElementById("computeProgressBar").innerHTML = "Idle";
      for (var i = 0; i < this.workerBackLog.length; i++) {
        if (this.workerBackLog[i].length) {
          this.queueWork(Object.values(work)[i], this.workerBackLog[i]);
        }
      }
      return;
    }
    this.callback(e);
  }

  sendWork(data, worker_id) {
    console.log("sending work");
    this.availableWorkers.set(worker_id, worker_id);
    this.available = false;
    data.thread_id = worker_id;
    this.workers[worker_id].postMessage(data);
  }

  terminateWorkers() {
    console.log("terminated");
    for (var i = 0; i < navigator.hardwareConcurrency; i++) {
      this.workers[i].terminate();
    }
    console.log(this.workers);
    this.availableWorkers.clear();
    this.available = true;
  }
  setOnFinishedCallback(callback) {
    this.onFinishedCallback = callback;
  }
  setCallBack(callback) {
    this.callback = callback;
  }

  callback = function(e) {};
  onFinishedCallback = function() {};
  available = true;
  workers = [];
  worker_ids = [];
  availableWorkers = new Map();
  workerBackLog = [];
  currentWork = null;
  currentWorkIndex = 0;
}
