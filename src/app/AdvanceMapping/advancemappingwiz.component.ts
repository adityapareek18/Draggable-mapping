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

  constructor() {
  }

  @Input() data1: Object;
  @Input() data2: Object;

/*{
  firstName: 'a',
  lastName: 'b',
  postalAddress: {
    country: 'APE',
    city: 'jp',
    street: '',
  },
  phone: '9989',
  deliveryAddress: {
    country: 'APE',
    city: 'jp',
    street: 'noida',
  },
  customerId: 'asd',
  id: 'asd',
  email: 'asd'
}
{name: 'something', age: '12', address: {street: {line1: '', line2: ''}, building: 'sdf'}}*/

  connectLine(value) {
    const that = this;
    this.lineIds.push(value);
    this.preparePreview(value.split('|')[0].substring(1), value.split('|')[1].substring(1));
    this.connectLines();
  }

  preparePreview(source, dest) {
    this.preview[dest] = source;
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
      if (start && end) {
        newLine = new LeaderLine(
          start, end,
          {color: 'black', size: 1, startPlug: 'square', endPlug: 'square', middleLabel: LeaderLine.pathLabel('Delete')
          }
        );
      } else {
        start = start ? start : document.getElementById(this.getParentId(l.split('|')[0]));
        end = end ? end : document.getElementById(this.getParentId(l.split('|')[1]));
        if (start && end) {
          newLine = new LeaderLine(
            start, end,
            {color: 'black', size: 1, dash: true, startPlug: 'square', endPlug: 'square'}
          );
          // that.lineIds.push(start.id + '|' + end.id);
        }
      }
      if (newLine) { that.lines.push(newLine); }
    });
    document.getElementById('frame').addEventListener('scroll', AnimEvent.add(function () {
      that.lines.forEach((line) => {
        line.position();
      });
    }), false);
  }

  getParentId(id) {
    if (id.lastIndexOf('_') > 0) {
      return id.substring(0, id.lastIndexOf('_'));
    }
    return id;
  }

  hideLines() {
    const items = document.getElementsByClassName('leader-line');
    for (const i in items) {
      items[i].classList.add('hidden');
    }
  }

  showLines() {
    const items = document.getElementsByClassName('leader-line');
    for (let i in items) {
      items[i].classList.remove('hidden');
    }
  }
}
