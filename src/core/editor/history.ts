/** Pila de snapshots serializados para deshacer/rehacer. */
export class History {
  private stack: string[] = [];
  private index = -1;

  constructor(private readonly limit = 100) {}

  /** Agrega un snapshot; devuelve false si es idéntico al actual. */
  push(snapshot: string): boolean {
    if (this.stack[this.index] === snapshot) return false;
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(snapshot);
    if (this.stack.length > this.limit) this.stack.shift();
    this.index = this.stack.length - 1;
    return true;
  }

  undo(): string | undefined {
    if (!this.canUndo) return undefined;
    this.index -= 1;
    return this.stack[this.index];
  }

  redo(): string | undefined {
    if (!this.canRedo) return undefined;
    this.index += 1;
    return this.stack[this.index];
  }

  get canUndo(): boolean {
    return this.index > 0;
  }

  get canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }
}
