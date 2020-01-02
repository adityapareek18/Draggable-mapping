import {Component, Inject, Input} from '@angular/core';
import 'leader-line/leader-line.min';
import 'anim-event/anim-event.min';
import {DOCUMENT} from '@angular/common';

declare const LeaderLine: any;
declare const AnimEvent: any;

@Component({
  selector: 'app-adv-map-wiz',
  templateUrl: './advancemappingwiz.component.html',
  styleUrls: ['./advancemappingwiz.component.css'],
})
export class AdvanceMappingWizComponent {

  lineIds = [];
  lines = [];
  preview = {};
  transformationScript = [];
  sourceFlatMap = {};
  dragNode = {};
  dragNodeId = '';
  dragData = new Map<String, String>();
  mappingActive = true;

  constructor() {
  }

  @Input() data1: Object;
  @Input() data2: Object;

  connectLine(value) {
    const that = this;
    this.lineIds.push(value);
    this.prepareScript(value);
    this.preparePreview(value);
    this.connectLines();
  }

  preparePreview(value) {
    this.preview[value.split('|')[1].substring(1).replace(/__/g, '.')] =
      value.split('|')[0].substring(1).replace(/__/g, '.');
  }

  prepareScript(value) {
    let shiftOperation = this.transformationScript.find(val => val.operation === 'shift');
    if (shiftOperation) {
      shiftOperation['spec'][value.split('|')[1].substring(1).replace(/__/g, '.')] =
        value.split('|')[0].substring(1).replace(/__/g, '.');
    } else {
      this.transformationScript.push({
        'operation': 'shift',
        'spec': {}
      });
      shiftOperation = this.transformationScript.find(val => val.operation === 'shift');
      shiftOperation['spec'][value.split('|')[1].substring(1).replace(/__/g, '.')] =
        value.split('|')[0].substring(1).replace(/__/g, '.');
    }
  }

  removeAllLines() {
    this.lines.forEach((line) => {
      line.remove();
    });
    this.lines = [];
  }

  connectLines() {
    const that = this;
    this.removeAllLines();
    that.lineIds.forEach((l, i) => {
      let start = document.getElementById(l.split('|')[0]);
      let end = document.getElementById(l.split('|')[1]);
      let newLine = null;
      if (start && end && this.mappingActive) {
        newLine = new LeaderLine(
          start, end,
          {
            color: 'black', size: 1, startPlug: 'square', endPlug: 'square', middleLabel: LeaderLine.pathLabel('Delete'),
            startSocket: 'right', endSocket: 'left'
          }
        );
      } else {
        start = start ? start : document.getElementById(this.getParentId(l.split('|')[0]));
        end = end ? end : document.getElementById(this.getParentId(l.split('|')[1]));
        if (start && end && this.mappingActive) {
          newLine = new LeaderLine(
            start, end,
            {color: 'black', size: 1, dash: true, startPlug: 'square', endPlug: 'square', startSocket: 'right', endSocket: 'left'}
          );
          // that.lineIds.push(start.id + '|' + end.id);
        }
      }
      if (newLine) {
        that.lines.push(newLine);
      }
    });
    document.getElementById('frame').addEventListener('scroll', AnimEvent.add(function () {
      that.lines.forEach((line) => {
        line.position();
      });
    }), false);
  }

  getParentId(id) {
    if (id.lastIndexOf('__') > 0) {
      return id.substring(0, id.lastIndexOf('__'));
    }
    return id;
  }

  hideLines() {
    const items = document.getElementsByClassName('leader-line');
    Array.from(items).forEach(item => {
      item.classList.add('hidden');
    });
  }

  showLines() {
    const items = document.getElementsByClassName('leader-line');
    Array.from(items).forEach(item => {
      item.classList.remove('hidden');
    });
  }

  setSourceData(dragData) {
    this.dragData = dragData;
    this.sourceFlatMap = dragData.get('dragData');
    this.dragNode = dragData.get('dragData');
    this.dragNodeId = dragData.get('dragNodeId');
  }

  openTab(evt, tabName) {
    let i, tabContent, tabLinks;
    tabContent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabContent.length; i++) {
      tabContent[i].className += ' hidden';
    }
    tabLinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tabLinks.length; i++) {
      tabLinks[i].className = tabLinks[i].className.replace(' active', '');
    }
    document.getElementById(tabName).classList.remove('hidden');
    if (tabName !== '1a') {
      this.mappingActive = false;
    } else {
      this.mappingActive = true;
      this.connectLines();
    }
    evt.currentTarget.className += ' active';
  }
}
