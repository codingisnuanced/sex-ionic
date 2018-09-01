import { Component } from '@angular/core';
import { MenuController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

    constructor(public menu: MenuController) {
        menu.enable(true);
    }

    ngAfterViewInit() {
        // TODO: particlesJS config should be loaded with consideration of screen size
        window['particlesJS'].load('page-home-content', 'assets/config/particles.json', function() {
            console.log('callback - particles.js config loaded');
        });
    }

}
