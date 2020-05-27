const SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');
const ipcRenderer = require('electron').ipcRenderer;
const remote  = require('electron').remote;
const os = require('os');
const md5file = require('md5-file');
const Avrgirl = require('avrgirl-arduino');