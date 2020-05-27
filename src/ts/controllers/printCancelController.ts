import { BaseController } from "./baseController";

export class PrintCancelController extends BaseController {
  private cancelled = false;
  private stopped = false;
  protected onInit() {}
  protected onActivate() {
    this.activateSubscreen('question');
    this.cancelled = false;
    this.stopped = false;
  }
  protected onDeactivate() {}

  public stop() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 A'});
    const buttons = { "print_stop_no": ["visible", "left", "disabled"], "print_stop_yes": ["visible", "right", "disabled"] };
    this.bm.setState(buttons);  
  }

  public finish() {
    this.sm.open('home');
  }

  public update(data: {[key: string]: any}) {
    if (this.activated && data.cancelled == 1 && !this.cancelled) {
      this.cancelled = true;
      this.activateSubscreen('confirm');
      const buttons = { "print_close": ["visible", "right", "disabled"] };
      this.bm.setState(buttons);  
    }
    if (this.activated && data.printing == 0 && this.getCurrentSubScreen() == 'confirm' && !this.stopped) {
      this.stopped = true;
      const buttons = { "print_close": ["visible", "right"] };
      this.bm.setState(buttons);
    }
    if (this.activated && data.printing == 1 && data.cancelled == 0) {
      this.sm.open('print');
    }
  }
}