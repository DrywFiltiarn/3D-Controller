import { BaseController } from "./baseController";

export class UpdateBardoController extends BaseController {
  private msgTarget: HTMLElement;
  private skip: HTMLElement;

  protected onInit() {
    this.setupElements();
  }
  protected onActivate() {
    this.msgTarget.innerHTML = this.screenData.msg.replace(/\n/g, '<br>');

    const buttons = { cancel: ["visible", "left"], update_confirm: ["visible", "right"] };
    this.bm.setState(buttons);
    this.activateSubscreen('confirm');
  }

  protected onDeactivate() {}

  private setupElements() {
    this.msgTarget = this.screen.querySelector('.msg');
    this.skip = this.screen.querySelector('#skip_bardo_update');

    this.skip.addEventListener('change', (evt) => {
      const target: HTMLInputElement = <HTMLInputElement>evt.target;
      if (target.checked) {
        this.pm.ignoreBardoFirmwareUpdate(true);
        const buttons = { close: ["visible", "right"] };
        this.bm.setState(buttons);
      } else {
        this.pm.ignoreBardoFirmwareUpdate(false);
        const buttons = { update_cancel: ["visible", "left"], update_confirm: ["visible", "right"] };
        this.bm.setState(buttons);
      }
    });
  }

  public confirm() {
    const buttons = { loading: ['visible'] };
    this.bm.setState(buttons);
    this.activateSubscreen('process')

    this.pm.flashBardoFirmware()
      .then(result => {
        const buttons = { update_complete: ['visible', 'right'] };
        this.bm.setState(buttons);
        this.activateSubscreen('complete')
      })
      .catch(err => {
        console.error(err);
      });
  }
}