export class BooleanState {
  private state: boolean = false;

  toggle(): void {
    this.state = !this.state;
  }

  val(): number {
    return this.state ? 1 : 0;
  }
}
