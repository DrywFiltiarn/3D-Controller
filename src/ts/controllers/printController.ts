import { BaseController } from "./baseController";

export class PrintController extends BaseController {
  private progress: HTMLElement;
  private label: HTMLElement;
  private perc: number = 0;
  private file: string = '';
  private paused: number = 0;
  private completed: boolean = false;

  protected onInit() {
    this.setupProgress();
  }
  protected onActivate() {
    this.completed = false;
  }
  protected onDeactivate() {}

  private setupProgress() {
    this.progress = this.screen.querySelector('.bar .fill');
    this.label = document.querySelector('.print_file');
  }

  private updateInterface() {
    this.progress.style.width = this.perc + '%';
    this.label.innerText = this.file;

    if (this.paused) {
      const buttons = { "print_resume": ["visible", "small"], "print_stop": ["visible", "small"], "print_file": ["visible", "label", "disabled"] };
      this.bm.setState(buttons);
    } else {
      const buttons = { "print_pause": ["visible", "small"], "print_stop": ["visible", "small"], "print_file": ["visible", "label", "disabled"] };
      this.bm.setState(buttons);
    }
  }

  public pause() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M25'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G91'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z5'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G90'});
  }
  public resume() {
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G91'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G1 Z-5'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'G90'});
    this.pm.execute({action: 'serial', method: 'gcode', command: 'M24'});
  }
  public stop() {
    this.sm.open('print_cancel');
  }

  public update(data: {[key: string]: any}) {
    let update = false;
    if (this.perc != data.pperc) {
      this.perc = data.pperc || 0;
      update = true;
    }
    if (this.file != data.pfile) {
      this.file = data.pfile;
      update = true;
    }
    if (this.paused != data.paused) {
      this.paused = data.paused;
      update = true;
    }

    if (update && this.activated) this.updateInterface();

    if (this.activated) {
      if (data.printing == 0 && data.cancelled == 1) {
        this.sm.open('print_cancel');
      }
      if (data.printing == 0) {
        this.sm.open('print_complete');
      }
    }
  }
}