import { BaseController } from "./baseController";

declare var SerialPort;

export class SettingsController extends BaseController {
  protected onInit() {}
  protected onActivate() {
    SerialPort.list().then(ports => this.renderSelectOptions(ports));
    if (this.pm.getData('abl') != null) {
      const abl = <HTMLInputElement>document.querySelector('#abl');
      abl.checked = this.pm.getData('abl') == true;
    }

    const autoconnect = <HTMLInputElement>document.querySelector('#autoconnect');
    autoconnect.checked = localStorage.getItem('autoconnect') ? true : false;
  }
  protected onDeactivate() {}

  public save() {
    const select = <HTMLSelectElement>this.screen.querySelector(':scope #port');
    const serialPort = select.options.item(select.selectedIndex).text;

    if (select.selectedIndex == 0) localStorage.removeItem('port');
    else localStorage.setItem('port', serialPort);

    const abl = <HTMLInputElement>document.querySelector('#abl');
    this.pm.execute({action: 'serial', method: 'gcode', 'command': 'M1101 S' + (abl.checked ? 1 : 0)});
    this.pm.execute({action: 'serial', method: 'gcode', 'command': 'M500'});

    const autoconnect = <HTMLInputElement>document.querySelector('#autoconnect');
    this.pm.setAutoConnect(autoconnect.checked);
  }
  
  private renderSelectOptions(ports: {[key: string]: any}[]) {
    const select = <HTMLSelectElement>this.screen.querySelector(':scope #port');
    const serialPort = localStorage.getItem('port');

    for (let i = select.options.length - 1; i >= 0; i--) select.options.remove(i);

    const opt = new Option('-- Select serial port or "none" --', '-1', true, true);
    // opt.disabled = true;
    select.options.add(opt);

    ports.forEach((p, i) => {
      let opt = new Option(p.path, i.toFixed(0), serialPort == p.path, serialPort == p.path);
      select.options.add(opt);
    });
  }

  public update(data: {[key: string]: any}) {
    if (this.activated && data.printing != undefined && data.printing != 0) {
      this.sm.open('print');
    }
  }
}