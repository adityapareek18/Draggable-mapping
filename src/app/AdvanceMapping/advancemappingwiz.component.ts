import {Component, Inject} from '@angular/core';
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

  lines = [];

  constructor(@Inject(DOCUMENT) private document) {
  }

  data1 = {name: 'something', age: '12', address: {street: 'asdfsd', building: 'sdf'}};

  data2 = {
    firstName: 'a',
    lastName: 'b',
    postalAddress: {
      country: 'APE',
      city: 'jp',
      street: 'noida',
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
  };

  connectLine(value) {
    this.lines.push(new LeaderLine(
      document.getElementById(value.split('|')[0]),
      document.getElementById(value.split('|')[1]),
      {color: 'black', size: 1}
    ));
    this.lines.forEach((l) => {
      document.getElementById('dest').addEventListener('scroll', AnimEvent.add(function () {
        l.position();
      }), false);
    });
  }
}
