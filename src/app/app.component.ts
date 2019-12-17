import {Component} from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  constructor() {
  }

  data2 = {
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
  };

  data1 = {name: 'something', age: '12', address: {street: {line1: '', line2: ''}, building: 'sdf'}};

}
