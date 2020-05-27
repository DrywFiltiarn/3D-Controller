import { BaseController } from "./baseController";

export class LevelSensorController extends BaseController {
  private buttons: {[key: string]: HTMLElement} = {};
  private label: HTMLElement;
  private zoffset: string;
  private isProbing: boolean = false;
  private isSaving: boolean = false;

  protected onInit() {
    this.setupButtons();
    this.setupLabel();
  }
  protected onActivate() {
    this.probing();
  }
  protected onDeactivate() {}

  private setupLabel() {
    if (!this.label) this.label = this.screen.querySelector('.label');
    this.updateInterface();
  }
  private setupButtons() {
    if (Object.keys(this.buttons).length === 0) {
      const buttons = this.screen.querySelectorAll('button');
      buttons.forEach(b => this.buttons[b.className] = <HTMLElement>b);
      Object.keys(this.buttons).forEach(k => this.buttons[k].addEventListener('click', evt => this.click(evt)));
    }
  }

  private updateInterface() {
    if (!this.label) return;
    this.label.innerHTML = this.zoffset;
  }

  private click(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.className;

    switch(action) {
      case 'dec-100':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1102 Z-100'});
        break;
      case 'dec-10':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1102 Z-10'});
        break;
      case 'inc-10':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1102 Z10'});
        break;
      case 'inc-100':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1102 Z100'});
        break;
    }
  }

  private probing() {
    this.isProbing = true;
    const buttons = { loading: ['visible'] };
    this.bm.setState(buttons);
    this.activateSubscreen('probing');
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M1102 P1'});
  }

  public continue() {
    const buttons = { level_finish: ['visible', 'right'] };
    this.bm.setState(buttons);
    this.activateSubscreen('offset');
  }

  public finish() {
    this.isSaving = true;
    const buttons = { loading: ['visible', 'right'] };
    this.bm.setState(buttons);
    this.activateSubscreen('finish');
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M1102 P2'});
  }

  public update(data: {[key: string]: any}) {
    if (data) {
      if (data.ablstatus) {
        switch (data.ablstatus) {
          case 5:
            if (!this.isProbing) break;
            this.isProbing = false;
            const buttons = { level_continue: ['visible', 'right'] };
            this.bm.setState(buttons);
            this.activateSubscreen('explain');
            break;
          case 7:
            if (!this.isSaving) break;
            this.isSaving = false;
            setTimeout(() => this.sm.open('home'), 5000);
        }
      }
      if (data.zoffset) {
        if (this.zoffset != data.zoffset) {
          this.zoffset = data.zoffset;
          this.updateInterface();
        }
      }
    }
    if (this.activated && data.printing != undefined && data.printing != 0) {
      this.sm.open('print');
    }
  }
}