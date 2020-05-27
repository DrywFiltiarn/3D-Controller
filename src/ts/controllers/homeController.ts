import { BaseController } from "./baseController";

export class HomeController extends BaseController {
  private lastConnectedState: boolean = false;

  protected onInit() {}
  protected onActivate() {
    this.lastConnectedState = this.pm.getData('connected');
    if (this.lastConnectedState) {
      const buttons = { "sdbrowse": ["visible", "full"] };
      this.bm.setState(buttons);
    } else {
      const buttons = { "sdbrowse": ["visible", "full", "disabled"] };
      this.bm.setState(buttons);
    }
  }
  protected onDeactivate() {}

  public update(data: {[key: string]: any}) {
    if (this.activated && data.printing != undefined && data.printing != 0) {
      this.sm.open('print');
    }

    if (this.activated) {
      if (data.connected) {
        if (data.connected != this.lastConnectedState) {
          const buttons = { "sdbrowse": ["visible", "full"] };
          this.bm.setState(buttons);
        }
        this.lastConnectedState = true;
      } else {
        if (data.connected != this.lastConnectedState) {
          const buttons = { "sdbrowse": ["visible", "full", "disabled"] };
          this.bm.setState(buttons);
        }
        this.lastConnectedState = false;
      }
    }
  }
}