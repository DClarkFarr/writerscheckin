import PQueue from "p-queue-cjs";

class QueueService {
  concurrency: number;
  maxSize: number;
  queue: PQueue;

  constructor(concurrency = 1, maxSize = 5) {
    this.concurrency = concurrency;
    this.maxSize = maxSize;

    this.queue = new PQueue({ concurrency });
  }

  add<T>(callback: () => Promise<T>): Promise<T | void> {
    if (this.queue.size > this.maxSize) {
      console.warn("queue size was", this.queue.size);
      this.queue.clear();
    }

    return this.queue.add(() => callback());
  }
}

export default QueueService;
