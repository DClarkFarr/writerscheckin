import PQueue from "p-queue-cjs";

class QueueService {
  concurency;
  maxSize;
  queue;

  constructor(concurrency = 1, maxSize = 5) {
    this.concurency = concurrency;
    this.maxSize = maxSize;

    this.queue = new PQueue({ concurrency });
  }

  add(callback: CallableFunction) {
    if (this.queue.size > this.maxSize) {
      console.warn("queue size was", this.queue.size);
      this.queue.clear();
    }

    return this.queue.add(() => callback());
  }
}

export default QueueService;
