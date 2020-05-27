import { BaseController } from "./baseController";

export class UpdateLcdController extends BaseController {
  private msgTarget: HTMLElement;
  private skip: HTMLElement;

  protected onInit() {
    this.setupElements();
  }
  protected onActivate() {
    this.msgTarget.innerHTML = this.screenData.msg.replace(/\n/g, '<br>');

    const buttons = { cancel: ["visible", "left"], update_download: ["visible", "right"] };
    this.bm.setState(buttons);
    this.activateSubscreen('confirm');
  }

  protected onDeactivate() {}

  private setupElements() {
    this.msgTarget = this.screen.querySelector('.msg');
    this.skip = this.screen.querySelector('#skip_lcd_update');

    this.skip.addEventListener('change', (evt) => {
      const target: HTMLInputElement = <HTMLInputElement>evt.target;
      if (target.checked) {
        this.pm.ignoreLcdFirmwareUpdate(true);
        const buttons = { close: ["visible", "right"] };
        this.bm.setState(buttons);
      } else {
        this.pm.ignoreLcdFirmwareUpdate(false);
        const buttons = { update_cancel: ["visible", "left"], update_confirm: ["visible", "right"] };
        this.bm.setState(buttons);
      }
    });
  }

  public confirm() {
    this.pm.downloadLcdFirmware();
    const buttons = { update_complete: ['visible', 'right'] };
    this.bm.setState(buttons);
    this.activateSubscreen('complete');
  }
}