import { BaseController } from "./baseController";

export class AboutController extends BaseController {
  protected onInit() {}
  protected onActivate() {}
  protected onDeactivate() {}

  public update(data: {[key: string]: any}) {
    if (this.activated && data.printing != undefined && data.printing != 0) {
      this.sm.open('print');
    }
  }
}