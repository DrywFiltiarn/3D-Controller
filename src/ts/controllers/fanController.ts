import { BaseController } from "./baseController";

export class FanController extends BaseController {
  private buttons: {[key: string]: HTMLElement} = {};
  private label: HTMLElement;
  private currentTarget: number = 100;
  private newTarget: number = 100;

  protected onInit() {
    this.setupLabel();
    this.setupButtons()
  }
  protected onActivate() {
    this.newTarget = this.currentTarget || 100;
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
    this.label.innerHTML = this.newTarget.toString();
  }

  private click(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.className;

    switch(action) {
      case 'set-min':
        this.newTarget = 0;
        break;
      case 'dec-5':
        this.newTarget -= 5;
        if (this.newTarget < 0) this.newTarget = 0;
        break;
      case 'inc-5':
        this.newTarget += 5;
        if (this.newTarget > 100) this.newTarget = 100;
        break;
      case 'set-max':
        this.newTarget = 100;
        break;
    }

    this.setValue();
  }

  public save() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M106 S' + Math.round(this.newTarget * 2.55)});
  }
  public update(data: {[key: string]: any}) {
    if (data) this.currentTarget = data['fan'];
  }
}