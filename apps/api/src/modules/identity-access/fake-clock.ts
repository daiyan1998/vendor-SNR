import type { Clock } from './clock.js';

export class FakeClock implements Clock {
  constructor(private current: Date = new Date()) {}

  now(): Date {
    return this.current;
  }

  advanceMs(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }

  set(date: Date): void {
    this.current = date;
  }
}
