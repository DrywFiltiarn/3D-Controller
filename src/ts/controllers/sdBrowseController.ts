import { BaseController } from "./baseController";

export class SdBrowseController extends BaseController {
  private dir: string = 'SDcard/';
  private files: string[] = [];
  private depth: number;
  private offset: number;
  private entrycount: number;
  private cache: string;
  private entries: NodeListOf<HTMLElement>;
  private buttons: {[key: string]: HTMLElement} = {};
  private location: HTMLElement;
  private selected: number = 0;

  protected onInit() {
    this.setupButtons();
    this.setupLocation();
    this.setupEntries();
  }
  protected onActivate() {
    this.selected = 0;
    this.updateInterface();
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 I'});
  }
  protected onDeactivate() {}

  private setupButtons() {
    if (Object.keys(this.buttons).length === 0) {
      const buttons = this.screen.querySelectorAll('button');
      buttons.forEach(b => this.buttons[b.className] = <HTMLElement>b);
      Object.keys(this.buttons).forEach(k => this.buttons[k].addEventListener('click', evt => this.clickButton(evt)));
    }
  }
  private setupLocation() {
    if (!this.location) this.location = this.screen.querySelector('.location');
    this.updateInterface();
  }
  private setupEntries() {
    if (!this.entries) this.entries = this.screen.querySelectorAll('.entry');
    this.entries.forEach((e, i) => e.addEventListener('click', () => this.clickEntry(i)));
    this.updateInterface();
  }

  private clickButton(evt: Event) {
    const target = <HTMLElement>evt.target;
    const action = target.className.split(' ')[0];
    let offset;

    switch (action) {
      case 'up':
        this.selected = 0;
        offset = this.offset - 3;
        if (offset < 0) offset = 0;
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 L O' + offset});
        break;
      case 'down':
        this.selected = 0;
        offset = this.offset + 3;
        if (offset >= this.entrycount - 1) offset = this.entrycount - 3;
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 L O' + offset});
        break;
      case 'return':
        this.selected = 0;
        this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 U'});
        break;
    }
  }
  private clickEntry(i) {
    const type = this.files[i].split('|')[0];

    if (type == 'D') {
      const index = this.offset + i;
      this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 S' + index});
      this.selected = 0;
    } else {
      this.selected = i + 1;
    }

    this.updateInterface();
  }

  private updateInterface() {
    if (this.location) this.location.innerHTML = this.dir;
    if (this.entries) {
      this.entries.forEach((e, i) => {
        e.classList.remove('gcode', 'dir');
        e.innerHTML = '';
        if (this.files[i]) {
          const parts = this.files[i].split('|');
          e.classList.add(parts[0] == 'G' ? 'gcode' : 'dir');
          e.innerHTML = parts[1];
        }
      });

      // Selected
      this.entries.forEach(e => e.classList.remove('selected'));
      if (this.selected != 0) {
        this.entries[this.selected - 1].classList.add('selected');
      }
    }

    // Dir up enable/disable
    if (this.depth == undefined || this.depth == 0) {
      this.buttons.return.classList.remove('enabled');
    } else {
      this.buttons.return.classList.add('enabled');
    }

    // Scroll up enable/disable
    if (this.offset == undefined || this.offset == 0) {
      this.buttons.up.classList.remove('enabled');
    } else {
      this.buttons.up.classList.add('enabled');
    }

    // Scroll down enable/disable
    if (this.offset == undefined || this.entrycount == undefined || this.offset+3 >= this.entrycount) {
      this.buttons.down.classList.remove('enabled');
    } else {
      this.buttons.down.classList.add('enabled');
    }

    // Open file enable/disable
    if (this.bm) {
      if (this.selected != 0) {
        const buttons = { "cancel": ["visible", "left"], "open": ["visible", "right"] };
        this.bm.setState(buttons);
      } else {
        const buttons = { "cancel": ["visible", "left"], "open": ["visible", "right", "disabled"] };
        this.bm.setState(buttons);
      }
    }
  }

  public open() {
    let index = this.offset + this.selected - 1;
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M1104 S' + index});
  }

  public update(data: {[key: string]: any}) {
    if (data.sd) {
      if (JSON.stringify(data.sd) != this.cache) {
        this.dir = data.sd.dir
        this.files = [data.sd.entry1, data.sd.entry2, data.sd.entry3];
        this.depth = data.sd.depth;
        this.offset = data.sd.offset;
        this.entrycount = data.sd.entries;

        this.updateInterface();

        this.cache = JSON.stringify(data.sd);
      }
    }
    if (this.activated && data.printing != undefined && data.printing != 0) {
      this.sm.open('print');
    }
  }
}