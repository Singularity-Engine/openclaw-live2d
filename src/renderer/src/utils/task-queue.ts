/* eslint-disable no-promise-executor-return */
/* eslint-disable arrow-parens */
export class TaskQueue {
  private queue: (() => Promise<void>)[] = [];

  private running = false;

  private taskInterval: number;

  private pendingComplete = false;

  private activeTasks = new Set<Promise<void>>();

  constructor(taskIntervalMs = 3000) {
    this.taskInterval = taskIntervalMs;
  }

  addTask(task: () => Promise<void>) {
    this.queue.push(task);
    this.runNextTask();
  }

  clearQueue() {
    this.queue = [];
    this.activeTasks.clear();
    this.running = false;
  }

  private async runNextTask() {
    if (this.running || this.queue.length === 0) {
      if (this.queue.length === 0 && this.activeTasks.size === 0 && this.pendingComplete) {
        this.pendingComplete = false;
        await new Promise(resolve => setTimeout(resolve, this.taskInterval));
      }
      return;
    }

    this.running = true;
    const task = this.queue.shift();
    if (task) {
      // 添加任务超时保护
      const taskPromise = Promise.race([
        task(),
        new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Task timeout after 60 seconds')), 60000);
        })
      ]);
      
      this.activeTasks.add(taskPromise);

      try {
        await taskPromise;
        await new Promise(resolve => setTimeout(resolve, this.taskInterval));
      } catch (error) {
        console.error('Task Queue Error', error);
        // 强制清理卡住的任务
        if (error.message?.includes('timeout')) {
          console.warn('Clearing stuck task from queue');
        }
      } finally {
        this.activeTasks.delete(taskPromise);
        this.running = false;
        // 异步执行下一个任务，避免阻塞
        setTimeout(() => this.runNextTask(), 0);
      }
    }
  }

  public hasTask(): boolean {
    return this.queue.length > 0 || this.activeTasks.size > 0 || this.running;
  }

  public waitForCompletion(): Promise<void> {
    this.pendingComplete = true;
    return new Promise((resolve) => {
      const check = () => {
        if (!this.hasTask()) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
}

export const audioTaskQueue = new TaskQueue(100); // 增加到100ms避免音频重叠
