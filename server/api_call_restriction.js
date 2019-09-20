module.exports = class CallReferenceTimer {
  constructor() {
    this.currentTime = this.getTime();
    this.numberOfCalls = 0;
    this.maxNumberOfCalls = 30;
    this.timeStep = 60;
  }

  incrementCalls() {
    if (this.checkTime()) {
      if (this.numberOfCalls > this.maxNumberOfCalls) {
        return false;
      }
      this.numberOfCalls += 1;
      return true;
    } else {
      this.currentTime = this.getTime();
      this.numberOfCalls = 1;
      return true;
    }
  }

  checkTime() {
    return this.currentTime + this.timeStep < this.getTime();
  }

  getTime() {
    return Math.floor(Date.now() / 1000);
  }
};
