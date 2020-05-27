import { BaseController } from "./baseController";

export class AxesController extends BaseController {
  private buttons: {[key: string]: HTMLElement} = {};
  private label: HTMLElement;
  private axisPositions: {x: any, y: any, z: any} = {x: '?', y: '?', z: '?'};
  private targetAxis: 'x' | 'y' | 'z' = 'x';

  protected onInit() {
    this.setupButtons()
    this.setupLabel();
  }
  protected onActivate() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G91'});
  }
  protected onDeactivate() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G90'});
  }

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
    if (typeof this.axisPositions[this.targetAxis] === 'string') {
      this.label.innerHTML = this.axisPositions[this.targetAxis];
    } else {
      this.label.innerHTML = this.axisPositions[this.targetAxis].toFixed(2);
    }
    
    Object.keys(this.buttons).forEach(k => {
      if (this.buttons[k].className.match(/axis-/)) this.buttons[k].classList.remove('current');
      if ((new RegExp('axis-' + this.targetAxis)).test(this.buttons[k].className)) this.buttons[k].classList.add('current');
    });
  }

  private click(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.className;

    if (/axis-/.test(action)) {
      this.targetAxis = <'x'|'y'|'z'>action.replace(/^axis-([x-z]).*?$/, '$1');
      this.updateInterface();
      return this.pm.execute({action: ''});
    }

    switch(action) {
      case 'dec-10':
        this.pm.execute({action: 'serial', method: 'gcode', command: ['G1 ', this.targetAxis.toUpperCase(), '-10'].join('')});
        break;
      case 'dec-5':
        this.pm.execute({action: 'serial', method: 'gcode', command: ['G1 ', this.targetAxis.toUpperCase(), '-5'].join('')});
        break;
      case 'dec-1':
        this.pm.execute({action: 'serial', method: 'gcode', command: ['G1 ', this.targetAxis.toUpperCase(), '-1'].join('')});
        break;
      case 'inc-1':
        this.pm.execute({action: 'serial', method: 'gcode', command: ['G1 ', this.targetAxis.toUpperCase(), '1'].join('')});
        break;
      case 'inc-5':
        this.pm.execute({action: 'serial', method: 'gcode', command: ['G1 ', this.targetAxis.toUpperCase(), '5'].join('')});
        break;
      case 'inc-10':
        this.pm.execute({action: 'serial', method: 'gcode', command: ['G1 ', this.targetAxis.toUpperCase(), '10'].join('')});
        break;
    }
  }

  public update(data: {[key: string]: any}) {
    if (data) {
      if (data['x']) this.axisPositions.x = data['x'];
      if (data['y']) this.axisPositions.y = data['y'];
      if (data['z']) this.axisPositions.z = data['z'];
      this.updateInterface();
    }
    if (this.activated && data.printing != undefined && data.printing != 0) {
      this.sm.open('print');
    }
  }
}