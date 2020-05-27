import { Evaluations, Expression } from "../types";
import { BaseManager } from "../baseManager";
import { ButtonManager } from "../buttonManager";
import { ControlManager } from "../controlManager";
import { PrinterManager } from "../printerManager";
import { ScreenManager } from "../screenManager";

export abstract class BaseController {
  protected bm: ButtonManager;
  protected cm: ControlManager;
  protected pm: PrinterManager;
  protected sm: ScreenManager;
  protected activated: boolean = false;
  protected screen: HTMLElement;
  protected dataBindings: NodeListOf<HTMLElement>;
  protected dataEvals: NodeListOf<HTMLElement>;
  protected subscreens: {[key: string]: HTMLElement} = {};
  protected screenData: {[key: string]: any} = {};

  protected abstract onInit();
  protected abstract onActivate();
  protected abstract onDeactivate();

  protected activateSubscreen(name: string) {
    Object.keys(this.subscreens).forEach(k => this.subscreens[k].classList.remove('current'));
    if (this.subscreens[name]) this.subscreens[name].classList.add('current');
  }

  protected getCurrentSubScreen(): string {
    let current: string;
    Object.keys(this.subscreens).forEach(k => this.subscreens[k].classList.contains('current') ? current = k : null );
    return current;
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

    if (dataValue === undefined) return false;

    switch(comparator) {
      case 'lt':  return dataValue < compareValue;
      case 'lte': return dataValue <= compareValue;
      case 'eq':  return dataValue == compareValue;
      case 'ne':  return dataValue != compareValue;
      case 'gte': return dataValue >= compareValue;
      case 'gt':  return dataValue > compareValue;
      default:    return false;
    }
  }

  public save() {}
  public _save() { 
    this.save();
  }
  public return() {}
  public _return() {
    this.return();
  }
  public update(data: {[key: string]: any}) {}
  public _update(data: {[key: string]: any}) {
    if (this.dataBindings && this.dataBindings.length) {
      this.dataBindings.forEach(b => {
        if (data.hasOwnProperty(b.dataset.binding)) {
          if (b.innerHTML != data[b.dataset.binding].toString()) {
            b.innerHTML = data[b.dataset.binding].toString();
          }
        }
      });
    }

    if (this.dataEvals && this.dataEvals.length) {
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
    this.update(data);
  }

  public register(manager: string, instance: BaseManager) {
    this[manager] = instance;
  }
  public registerScreen(screen: HTMLElement) {
    this.screen = screen;
    this.dataBindings = this.screen.querySelectorAll(':scope [data-binding]');
    this.dataEvals = this.screen.querySelectorAll(':scope [data-eval]')
    this.screen.querySelectorAll(':scope .subscreen').forEach(e => {
      const key = e.className.replace('subscreen ', '');
      this.subscreens[key] = <HTMLElement>e;
    });
    this.onInit();
  }
  public getScreen(): HTMLElement {
    return this.screen;
  }

  public setScreenData(data: {[key: string]: any}) {
    if (data) this.screenData = data;
  }
  
  public activate() {
    this.activated = true;
    this.onActivate();
  }
  public deactivate() {
    this.activated = false;
    this.onDeactivate();
  } 
}