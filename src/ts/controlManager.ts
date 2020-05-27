import { Evaluations, Expression } from "./types";
import { BaseManager } from "./baseManager";
import { PrinterManager } from "./printerManager";
import { ScreenManager } from "./screenManager";

export class ControlManager extends BaseManager {
  private sm: ScreenManager;
  private pm: PrinterManager;
  private controls: NodeListOf<HTMLElement>;
  private controlsByName: {[key: string]: HTMLElement} = {};
  private dataEvals: NodeListOf<HTMLElement>;

  constructor() {
    super();
    this.setupControls();
    this.setupEvals();
    this.setupEvents();
  }

  private setupEvals() {
    this.dataEvals = document.querySelectorAll('.controlbar [data-eval]');
    this.update({});
  }
  private setupControls() {
    this.controls = document.querySelectorAll('.controlbar button');
    this.controls.forEach(e => this.controlsByName[e.className] = e);
  }

  private setupEvents() {
    this.controls.forEach(e => e.addEventListener('click', evt => this.click(evt)));
  }

  private evaluate(target: HTMLElement, evaluations: Evaluations, data: {[key: string]: any}) {
    evaluations.forEach(ev => {
      let result = true;
      ev.expr.forEach(ex => result = result && this.evaluateExpression(ex, data))
      if (ev.class) {
        if (result) target.classList.add(ev.class);
        else target.classList.remove(ev.class);
      }
    });
  }

  private evaluateExpression(expression: Expression, data: {[key: string]: any}): boolean {
    const comparator = expression[1];
    const dataValue = data[expression[0]];
    const compareValue = expression[2];

    // if (dataValue === undefined) return false;

    switch(comparator) {
      case 'lt':  return dataValue < compareValue;
      case 'lte': return dataValue <= compareValue;
      case 'ne':  return dataValue != compareValue;
      case 'eq':  return dataValue == compareValue;
      case 'gte': return dataValue >= compareValue;
      case 'gt':  return dataValue > compareValue;
      default:    return false;
    }
  }  

  private click(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.dataset.action;
    let parsedAction = null;
    
    if (action) {
      try {
        parsedAction = JSON.parse(action);
      } catch(e) {}
    }

    if (parsedAction) this.execute(parsedAction)
  }

  private execute(action: {action: string, method?: string, target?: string, page?: string}) {
    switch (action.action) {
      case 'open':
        this.sm.open(action.page);
        break;
      case 'toggle':
        break;
      case 'serial':
        this.pm.execute(action);
        break;
    }
  }

  public setState(state: {[key: string]: string[]}) {
    const classes = ['visible', 'disabled'];
    const keys: string[] = Object.keys(state);

    this.controls.forEach(e => e.classList.remove(...classes));
    keys.forEach(k => this.controlsByName[k] ? this.controlsByName[k].classList.add(...state[k]) : null);
  }

  public update(data: {[key: string]: any}) {
    if (this.dataEvals.length) {
      this.dataEvals.forEach(e => {
        let evaluations: Evaluations;
        try {
          evaluations = JSON.parse(e.dataset.eval);
          this.evaluate(e, evaluations, data);
        } catch(e) {
          console.log('Invalid evaluation on:', e, e.dataset.eval);
        }
      });
    }
  }
}