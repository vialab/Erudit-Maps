//double buffering to do rendering to and switch when the rendering is done
//the buffer is a Map
class RenderBuffer {
  constructor() {
    buffers[0] = new Map();
    buffers[1] = new Map();
  }

  switchFrontBuffer() {
    currentBuffer = Number(!Boolean(currentBuffer));
  }

  clearBackBuffer() {
    buffers[Number(!Boolean(this.currentBuffer))].clear();
  }

  getBackBuffer() {
    return buffers[Number(!Boolean(this.currentBuffer))];
  }

  getFrontBuffer() {
    return buffers[currentBuffer];
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
      workers[i] = new Worker("../js/worker.js");
      worker_ids[i] = i;
      this.availableWorkers.set(i, i);
    }
    //initialize workBackLog based on the work enum
    //therefore add new enums to work to allocate more backlogs
    tmpValues = Object.values(work);
    for (var i = 0; i < tmpValues.length; i++) {
      this.workerBackLog[tmpValues[i]] = [];
    }
  }

  queueWork(typeOfWork, data) {
    if (!available) {
      if (typeOfWork == currentWork) {
        //no point in finishing this as the map was updated
        this.terminateWorkers();
        //execute the new computation based on the updated map
        for (var i = 0; i < navigator.hardwareConcurrency; i++) {
          this.sendWork(data, i);
        }
      } else {
        //clear the old cache as it is being updated
        workerBackLog[typeOfWork].clear();
        //cache the new work
        workerBackLog[typeOfWork].push(data);
      }
    } else {
      //set current work
      //do work
      currentWork = typeOfWork;
      for (var i = 0; i < navigator.hardwareConcurrency; i++) {
        this.sendWork(data, i);
      }
    }
  }
  //this keeps track of when all the threads are down
  onMessageCallBack(e) {
    this.availableWorkers.delete(e.data.worker_id);
    if (this.availableWorkers.size == 0) {
      this.available = true;
      this.typeOfWork = null;
      for (var i = 0; i < this.workerBackLog.length; i++) {
        if (this.workerBackLog[i].length) {
          this.queueWork(Object.values(work)[i], this.workerBackLog[i]);
        }
      }
    }
    this.callback(e);
  }

  sendWork(data, worker_id) {
    this.availableWorkers.set(worker_id, worker_id);
    available = false;
    workers[worker_id].postMessage({ data: data, worker_id: worker_id });
  }

  terminateWorkers() {
    for (var i = 0; i < navigator.hardwareConcurrency; i++) {
      workers[i].terminate();
    }
    this.availableWorkers.clear();
    available = true;
  }

  setCallBack(callback) {
    this.callback = callback;
  }

  callback = function(e) {};
  available = true;
  workers = [];
  worker_ids = [];
  availableWorkers = new Map();
  workerBackLog = [];
  onMessageCallBack;
  currentWork = null;
  currentWorkIndex = 0;
}
