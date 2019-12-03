import {Component} from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  constructor() {}

  treeData = {
    phones: [
      {
        type: {
          code: 'HOME',
          id: 'mPhoneTypes/9481',
          title: 'Home'
        },
        phone: '@Current_Phone'
      }
    ],
    emails: {

      type: {
        id: 'mEmailTypes/8972',
        title: 'Personal'
      },
      email: '@CCC_EMAIL_ADDR',
      isPrimary: false
    }
  };
}
