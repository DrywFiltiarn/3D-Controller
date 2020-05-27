import { BaseManager } from "./baseManager";
import { PrinterManager } from "./printerManager";
import { ScreenManager } from "./screenManager";

export class ButtonManager extends BaseManager {
  private sm: ScreenManager;
  private pm: PrinterManager;
  private buttons: NodeListOf<HTMLElement>;
  private buttonsByName: {[key: string]: HTMLElement} = {};

  constructor() {
    super();
    this.setupControls();
    this.setupEvents();
  }

  private setupControls() {
    this.buttons = document.querySelectorAll('.buttonbar button');
    this.buttons.forEach(e => this.buttonsByName[e.className.replace(/\svisible/, '')] = e);
  }

  private setupEvents() {
    this.buttons.forEach(e => e.addEventListener('click', evt => this.click(evt)));
  }

  private click(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.dataset.action;
    let parsedAction = null;
    if (action) try { parsedAction = JSON.parse(action); } catch(e) {}
    if (parsedAction) this.execute(parsedAction)
  }

  public execute(action: {action: string, page?: string}) {
    switch (action.action) {
      case 'open':
        this.sm.open(action.page);
        break;
      case 'save':
        this.sm.save();
        break;
      case 'return':
        this.sm.return();
        break;
      case 'controller':
        this.sm.execute(action);
        break;
      case 'serial':
        this.pm.execute(action);
        break;
      }
  }

  public setState(state: {[key: string]: string[]}) {
    const classes = ['visible', 'disabled', 'right', 'left', 'small', 'label'];
    const keys: string[] = Object.keys(state);

    this.buttons.forEach(e => e.classList.remove(...classes));
    keys.forEach(k => this.buttonsByName[k] ? this.buttonsByName[k].classList.add(...state[k]) : null);
  }
}