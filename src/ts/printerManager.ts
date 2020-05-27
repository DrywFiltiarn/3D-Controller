import { BaseManager } from "./baseManager";
import { ControlManager } from "./controlManager";
import { ScreenManager } from "./screenManager";
import { UpdateManager } from "./updateManager";

declare var SerialPort;
declare var ReadLine;

export class PrinterManager extends BaseManager {
  private sm: ScreenManager;
  private cm: ControlManager;
  private um: UpdateManager;
  private connected: boolean;
  private serialport;
  private parser;
  private data: {[key: string]: any} = {};
  private firmwareChecked: boolean = false;
  private isBardo: boolean = false;

  constructor() {
    super();
  }

  public connect() {
    const port = localStorage.getItem('port');
    if (!port) {
      this.sm.open('settings');
      return;
    }

    this.serialport = new SerialPort(port, {
      baudRate: 250000,
      autoOpen: false
    });
    this.serialport.on('open', err => {
      if (!err) {
        setTimeout(() => this.setupMachine(), 1000);
        this.connected = true;
        this.data.connected = true;
      }
    })
    this.serialport.on('close', err => {
      if (err) console.log('onclose', err);
      this.serialport = null;
      this.connected = false;
      this.data.connected = false;  
    })

    this.parser = this.serialport.pipe(new ReadLine());
    this.parser.on('data', data => this.processLineData(data));

    this.serialport.open(err => {
      if (err) alert(`Could not connect to serial port '${port}'. Please make sure your printer is turned on and connected to your computer, also make sure the correct port was selected in the application settings.`);
    });
  }
  public disconnect() {
    this.send('M1111 R0');
    this.data = {};
    this.serialport.close();
    this.sm.update(this.data);
  }

  private setupMachine() {
    this.send('M1111 R1');
    setTimeout(() => {
      if (this.isBardo) {
        this.verifyBardoFirmware();
        this.verifyLcdFirmware();
      } else {
        this.sm.open('incompatible');
        this.disconnect();
      }
    }, 1000); // Allow some time for Bardo to start sending data
  }

  private send(command: string) {
    this.serialport.write(command + '\n');
  }

  private processLineData(data) {
    if (/^collector/.test(data)) {
      const fragments = data.match(/^collector\.(.*?)\.(.*?)=(.*?)$/m);
      if (fragments[2] == 'txt') this.data[fragments[1]] = fragments[3].replace(/"/g, '').trim();
      if (fragments[2] == 'val') this.data[fragments[1]] = parseFloat(fragments[3]);

      // Special handler for printtime (ptime)
      if (fragments[1] == 'ptime') {
        let ptime_proc = '';
        let tmp = parseFloat(fragments[3]);
        let hours = Math.floor(tmp/3600);
        tmp -= hours * 3600;
        let minutes = Math.floor(tmp/60)
        tmp -= minutes * 60;
        let seconds = tmp;
        this.data['ptime_proc'] = [hours, (minutes < 10 ? '0' : '') + minutes, (seconds < 10 ? '0' : '') + seconds].join(':');
      }
    } else if (/^browsesd/.test(data)) {
      if (!this.data.sd) this.data.sd = {};
      const fragments = data.match(/^browsesd\.(.*?)\.(.*?)(\+?)=(.*?)$/m);

      if (fragments[2] == 'txt') {
        if (fragments[3] == "+") {
          this.data.sd[fragments[1]] += fragments[4].replace(/"/g, '').trim();
        } else {
          this.data.sd[fragments[1]] = fragments[4].replace(/"/g, '').trim();
        }
      }
      if (fragments[2] == 'val') this.data.sd[fragments[1]] = parseFloat(fragments[4]);
    } else if (!(/busy/.test(data))) {
      if (/echo:Marlin/.test(data)) {
        if (/echo:Marlin bardo/.test(data)) this.isBardo = true;
        else this.isBardo = false;
      }

      // const d = new Date();
      // console.log([d.getHours(), d.getMinutes(), d.getSeconds(), ''].join(':'), data);
    }

    this.sm.update(this.data);
  }

  public execute(action: {action: string, method?: string, target?: string, command?: string}) {
    switch([action.method,action.target].join('_')) {
      case "gcode_":
        console.log(action.command);
        if (this.connected) this.send(action.command);
        break;
      case "home_":
        this.send('G28');
        break;
      case "purge_":
        this.send('G91');
        this.send('G1 E50 F250');
        this.send('G90');
        break;
      case "toggle_connection":
        if (this.connected) this.disconnect();
        else this.connect();
        break;
      case "toggle_motors":
        if (this.connected) {
          if (this.data.mhold) {
            this.send('M18');
          } else {
            this.send('M17');
          }
        }
        break;
      case "toggle_light":
        if (this.connected) {
          if (this.data.light) {
            this.send('M355 S0');
          } else {
            this.send('M355 S1');
          }
        }
        break;
      case "update_":
        this.verifyBardoFirmware(false, true);
        this.verifyLcdFirmware(false, true);
        break;
    }
  }

  public getData(entry: string): any {
    return this.data[entry] || null;
  }

  private verifyBardoFirmware(retry: boolean = false, manual: boolean = false) {
    try {
      if (this.data.pcbfw && this.sm.currentScreenName != 'update_lcd') {
        const activeVersionString: string = this.data.pcbfw.replace(/[a-z-]/g, '');
        const activeVersionSegments: string[] = activeVersionString.split('.');
        const activeVersionNr: number = (parseInt(activeVersionSegments[0]) * 1000000) + (parseInt(activeVersionSegments[1]) * 1000) + (parseInt(activeVersionSegments[2]))
        const currentVersionString: string = this.um.currentBardoVersion;
        const currentVersionSegments: string[] = currentVersionString.split('.');
        const currentVersionNr: number = (parseInt(currentVersionSegments[0]) * 1000000) + (parseInt(currentVersionSegments[1]) * 1000) + (parseInt(currentVersionSegments[2]))

        const ignoredVersion: string = localStorage.getItem('ignore_bardo_version');

        if (activeVersionNr < currentVersionNr) {

          if (!manual && ignoredVersion && ignoredVersion == currentVersionString) {
            console.log('Ignoring Bardo update as per user request');
            return;
          }
          this.sm.open('update_bardo', {msg: 'A new version of the Bardo firmware is available. Do you want to update the firmware from <strong>' + activeVersionString + '</strong> to <strong>' + currentVersionString + '</strong>?', type: 'success'});
        }
      } else {
        if (!retry) {
          setTimeout(() => this.verifyBardoFirmware(this.sm.currentScreenName != 'update_lcd', manual), 3000); // Allow additional time once more
        } else {
          this.sm.open('update_bardo', {msg: 'Bardo is currently using firmware prior to 2.1.3, which is not supported by Trinity. Do you want to update the firmware to <strong>' + this.um.currentBardoVersion + '</strong>?', type: 'warning'});
        }
      }
    } catch(e) {}
  }

  private verifyLcdFirmware(retry: boolean = false, manual: boolean = false) {
    try {
      if (this.data.lcdfw && this.sm.currentScreenName != 'update_bardo') {
        const activeVersionString: string = this.data.lcdfw.replace(/[a-z-]/g, '');
        const activeVersionSegments: string[] = activeVersionString.split('.');
        const activeVersionNr: number = (parseInt(activeVersionSegments[0]) * 1000000) + (parseInt(activeVersionSegments[1]) * 1000) + (parseInt(activeVersionSegments[2]))
        const currentVersionString: string = this.um.currentLcdVersion;
        const currentVersionSegments: string[] = currentVersionString.split('.');
        const currentVersionNr: number = (parseInt(currentVersionSegments[0]) * 1000000) + (parseInt(currentVersionSegments[1]) * 1000) + (parseInt(currentVersionSegments[2]))

        const ignoredVersion: string = localStorage.getItem('ignore_lcd_version');

        if (activeVersionNr < currentVersionNr) {

          if (!manual && ignoredVersion && ignoredVersion == currentVersionString) {
            console.log('Ignoring LCD update as per user request');
            return;
          }

          this.sm.open('update_lcd', {msg: 'A new version of the LCD firmware is available. Do you want to download the <strong>' + currentVersionString + '</strong> firmware?'});
        }
      } else {
        if (!retry) {
          setTimeout(() => this.verifyLcdFirmware(this.sm.currentScreenName != 'update_bardo', manual), 3000); // Allow additional time once more
        }
        // We don't allow notifying about an incompatible LCD firmware here, as we don't know if there actually is a lcd
        // else {
        // }
      }
    } catch(e) {}
  }

  public flashBardoFirmware(): Promise<any> {
    return this.um.flashHexFile();
  }

  public downloadLcdFirmware() {
    this.um.downloadLcdFirmware();
  }

  public ignoreBardoFirmwareUpdate(state: boolean) {
    const currentVersionString: string = this.um.currentBardoVersion;

    if (state) {
      localStorage.setItem('ignore_bardo_version', currentVersionString);
    } else {
      localStorage.removeItem('ignore_bardo_version');
    }
  }

  public ignoreLcdFirmwareUpdate(state: boolean) {
    const currentVersionString: string = this.um.currentLcdVersion;

    if (state) {
      localStorage.setItem('ignore_lcd_version', currentVersionString);
    } else {
      localStorage.removeItem('ignore_lcd_version');
    }
  }

  public setAutoConnect(connect: boolean = false) {
    if (connect) localStorage.setItem('autoconnect', 'true');
    else localStorage.removeItem('autoconnect');
  }
}