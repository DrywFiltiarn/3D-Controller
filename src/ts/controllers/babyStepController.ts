import { BaseController } from "./baseController";

export class BabyStepController extends BaseController {
  private buttons: {[key: string]: HTMLElement} = {};
  private label: HTMLElement;
  private currentValue: string = '?';

  protected onInit() {
    this.setupLabel();
    this.setupButtons()
  }
  protected onActivate() {
    this.setValue();
  }
  protected onDeactivate() {}

  private setupLabel() {
    if (!this.label) this.label = this.screen.querySelector('.label');
    this.setValue();
  }
  private setupButtons() {
    if (Object.keys(this.buttons).length === 0) {
      const buttons = this.screen.querySelectorAll('button');
      buttons.forEach(b => this.buttons[b.className] = <HTMLElement>b);
      Object.keys(this.buttons).forEach(k => this.buttons[k].addEventListener('click', evt => this.click(evt)));
    }
  }

  private setValue() {
    this.label.innerHTML = this.currentValue;
  }

  private click(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.className;

    switch(action) {
      case 'dec-100':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1103 Z-0.1'});
        break;
      case 'dec-10':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1103 Z-0.01'});
        break;
      case 'inc-10':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1103 Z0.01'});
        break;
      case 'inc-100':
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1103 Z0.1'});
        break;
    }

    this.setValue();
  }

  public update(data: {[key: string]: any}) {
    if (this.currentValue != data['babystep']) {
      this.currentValue = data['babystep'];
      this.setValue();
    } 
  }
}