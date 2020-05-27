import { BaseManager } from "./baseManager";
import { ControlManager } from "./controlManager";
import { ButtonManager } from "./buttonManager";
import { PrinterManager } from "./printerManager";

declare var ipcRenderer;
declare var remote;
declare var md5file;
declare var Avrgirl;

const updateBaseUrl = 'https://kodama3d.netsence.com/';
const updateFirmwareDir = 'firmware/';
const updateFirmwareVersions = 'versions.json';

export class UpdateManager extends BaseManager {
  private cm: ControlManager;
  private bm: ButtonManager;
  private pm: PrinterManager;
  private dataPath: string;
  public currentBardoVersion: string;
  private currentBardoHexFile: string;
  private currentBardoHexMd5: string;
  private currentBardoHexPath: string;
  public currentLcdVersion: string;
  private currentLcdHexFile: string;
  private currentLcdHexMd5: string;
  private currentLcdHexPath: string;

  constructor() {
    super();
    this.dataPath = remote.app.getPath('userData');

    ipcRenderer.on('download-complete', (event, file) => {
      console.log('download', event, file);
      if (file.options.id == 'versions') this.readVersionFile(file);
      if (file.options.id == 'hexfile') {
        const md5 = md5file.sync(file.path);
        if (md5 != this.currentBardoHexMd5) {
          const retry = confirm('Downloaded firmware HEX file (' + this.currentBardoHexFile + ') MD5 hash mismatch. The download is possibly corrupted. Do you want to try downloading it again?')
          if (retry) this.fetchHexFile();
        } else {
          this.currentBardoHexPath = file.path;
        }
      }
    });
    ipcRenderer.on('download-error', (event, err) => {
      console.log('download', event, err);
    });
    ipcRenderer.on('readfile-complete', (event, file) => {
      if (file.options.id == 'versions') this.processVersionFile(file);
    });
    ipcRenderer.on('readfile-error', (event, err) => {
      console.log('readfile', event, err);
    })

    this.fetchVersionFile();
  }

  private fetchVersionFile() {
    ipcRenderer.send('download', {
      url: updateBaseUrl + updateFirmwareVersions, 
      options: { 
        directory: this.dataPath,
        filename: 'versions.json',
        id: 'versions'
      }
    });
  }

  private readVersionFile(file) {
    ipcRenderer.send('readfile', {
      file: file.path,
      options: {
        id: 'versions'
      }
    });
  }

  private processVersionFile(file) {
    try {
      const data = JSON.parse(file.data);
      
      if (data.bardo && data.bardo.current) {
        this.currentBardoVersion = data.bardo.current.version;
        this.currentBardoHexFile = data.bardo.current.file;
        this.currentBardoHexMd5 = data.bardo.current.md5;
        this.fetchHexFile();
      }
      if (data.lcd && data.lcd.current) {
        this.currentLcdVersion = data.lcd.current.version;
        this.currentLcdHexFile = data.lcd.current.file;
        this.currentLcdHexMd5 = data.lcd.current.md5;
      }
    } catch(e) {
      console.log(e);
    }
  }

  private fetchHexFile() {
    ipcRenderer.send('download', {
      url: updateBaseUrl + updateFirmwareDir + this.currentBardoHexFile,
      options: {
        directory: this.dataPath,
        filename: this.currentBardoHexFile,
        id: 'hexfile'
      }
    });
  }

  public flashHexFile(): Promise<any> {
    this.pm.disconnect();
    const port = localStorage.getItem('port');
    const avrgirl = new Avrgirl({ board: 'mega', debug: true, port: port });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        avrgirl.flash(this.currentBardoHexPath, (err) => {
          if (!err) resolve();
          else reject(err);
        });
      }, 2500);
    });
  }

  public downloadLcdFirmware() {
    ipcRenderer.send('download', {
      url: updateBaseUrl + updateFirmwareDir + this.currentLcdHexFile,
      options: {
        filename: this.currentLcdHexFile,
        openFolderWhenDone: true,
        id: 'lcdfile',
      }
    });
  }
}