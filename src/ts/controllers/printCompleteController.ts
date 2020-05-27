import { BaseController } from "./baseController";

export class PrintCompleteController extends BaseController {
  protected onInit() {}
  protected onActivate() {}
  protected onDeactivate() {}

  public reprint() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 R'});
  }
  public finish() {
    this.sm.open('home');
  }

  public update(data: {[key: string]: any}) {
    if (this.activated && data.printing == 1 && data.cancelled == 0) {
      this.sm.open('print');
    }
  }
}