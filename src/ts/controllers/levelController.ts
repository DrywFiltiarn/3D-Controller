import { BaseController } from "./baseController";

export class LevelController extends BaseController {
  private manualStep: number = 0;
  private steps: NodeListOf<HTMLElement>;

  protected onInit() {
    this.steps = this.screen.querySelectorAll(':scope .step');
  }
  protected onActivate() {
    // 1 = enabled & present, 2 = enabled & !present, 3 = disabled
    const abl_status = this.pm.getData('abl');

    let buttons;
    if (abl_status == 1) {
      buttons = { level_manual: ["visible", "left"], level_sensor: ["visible", "right"] };
      this.bm.setState(buttons);
      this.activateSubscreen('choose');
    } else {
      this.manual();
    }
  }
  protected onDeactivate() {}

  private setStep(step: number) {
    this.steps.forEach(e => e.classList.remove('current'));
    this.steps[step-1].classList.add('current');
  }

  public manualProcessStart() {
    this.activateSubscreen('manual');
    this.manualStep = 1;
    this.setStep(this.manualStep);
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G4 P100'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G28'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G4 P100'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z7.5 F300'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 X15 Y110 F2400'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z0 F300'});
  }

  public manual() {
    this.manualProcessStart();
    const buttons = { level_cancel: ["visible", "left"], level_next: ["visible", "right"] };
    this.bm.setState(buttons);
    const controls = { "about": ["visible", "disabled"] };
    this.cm.setState(controls);
  }
  public next() {
    switch(++this.manualStep) {
      case 2:
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z7.5 F300'});
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 X15 Y15 F2400'});
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z0 F300'});
        break;
      case 3:
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z7.5 F300'});
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 X105 Y15 F2400'});
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z0 F300'});
        break;
      case 4:
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z7.5 F300'});
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 X105 Y110 F2400'});
        this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z0 F300'});
        const buttons = { level_restart: ["visible", "left"], level_finish: ["visible", "right"] };
        this.bm.setState(buttons);
        break;
    }
    this.setStep(this.manualStep);
  }

  public cancel() {
    this.finish();
  }
  public finish() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z7.5 F300'});
    this.sm.open('home');
  }

  public update(data: {[key: string]: any}) {
    if (this.activated && data.printing != undefined && data.printing != 0) {
      this.sm.open('print');
    }
  }
}