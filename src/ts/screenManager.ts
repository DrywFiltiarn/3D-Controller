import { BaseManager } from "./baseManager";
import { ButtonManager } from "./buttonManager";
import { ControlManager } from "./controlManager";
import { PrinterManager } from "./printerManager";

import { BaseController } from "./controllers/baseController";

import { screenControllers } from "./app";

export class ScreenManager extends BaseManager {
  private cm: ControlManager;
  private bm: ButtonManager;
  private pm: PrinterManager;
  private screens: NodeListOf<HTMLElement>;
  private screensByName: {[key: string]: HTMLElement} = {};
  public currentScreenName: string;
  private previousScreenName: string;
  private currentScreenController: BaseController;

  private xActionElements: NodeListOf<HTMLElement>;

  constructor() {
    super();
    this.setupScreens();
    this.setupEvents();
  }

  private setupScreens() {
    this.screens = document.querySelectorAll('.screen');
    this.screens.forEach(e => {
      this.screensByName[e.id] = e
      if (screenControllers[e.id]) {
        screenControllers[e.id].registerScreen(e);
        screenControllers[e.id].register('sm', this);
      }
    });

    this.xActionElements = document.querySelectorAll('[data-x-action]');
  }

  private setupEvents() {
    this.xActionElements.forEach(e => e.addEventListener('click', evt => this.click(evt)));
  }
 
  private click(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.dataset.xAction;
    let parsedAction = null;

    if (action) {
      try {
        parsedAction = JSON.parse(action);
      } catch(e) {}
    }

    if (parsedAction) this.execute(parsedAction)
  }

  public execute(action: {action: string, method?: string, target?: string, page?: string}) {
    switch (action.action) {
      case 'open':
        this.open(action.page);
        break;
      case 'controller':
        if (this.currentScreenController[action.method]) this.currentScreenController[action.method]();
        else console.log('Current screen controller:', this.currentScreenController.getScreen().id, 'does not implement method:', action.method);
      case 'serial':
        this.pm.execute(action);
        break;
    }
  }

  public ready() {
    this.open('home');
    document.body.classList.add('ready');
  }

  public setGlobals(values: {[key: string]: string}) {
    const keys = Object.keys(values);
    keys.forEach(k => document.querySelectorAll('.'+k).forEach(e => e.innerHTML = values[k]));
  }

  public open(screenName: string, data: {[key: string]: any} = null) {
    this.previousScreenName = this.currentScreenName;
    const screen = this.screensByName[screenName];
    if (!screen || screen.classList.contains('current')) return;
    this.screens.forEach(e => e.classList.remove('current'));
    screen.classList.add('current');

    if (this.currentScreenController) {
      this.currentScreenController.deactivate();
    }

    const controls = screen.dataset.controls;
    let parsedControls = null;
    if (controls) try { parsedControls = JSON.parse(controls); } catch(e) {}
    if (parsedControls) this.cm.setState(parsedControls);
    
    const buttons = screen.dataset.buttons;
    let parsedButtons = null;
    if (buttons) try { parsedButtons = JSON.parse(buttons); } catch(e) {}
    if (parsedButtons) this.bm.setState(parsedButtons);
    this.currentScreenName = screenName;

    if (screenControllers[screenName]) {
      this.currentScreenController = screenControllers[screenName];
      this.currentScreenController.setScreenData(data || null);
      this.currentScreenController.activate();
    } else {
      this.currentScreenController = null;
    }
  }

  public return() {
    if (this.currentScreenController) this.currentScreenController._return();
    this.open(this.previousScreenName);
  }

  public save() {
    if (this.currentScreenController) this.currentScreenController._save();
    this.open(this.previousScreenName);
  }

  public update(data: {[key: string]: any}) {
    this.cm.update(data);
    Object.keys(screenControllers).forEach(k => screenControllers[k]._update(data));
  }
}