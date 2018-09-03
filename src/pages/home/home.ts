import { Component } from '@angular/core';
import { MenuController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

    thepiece: Object;

    constructor(public menu: MenuController) {
        menu.enable(true);
        this.thepiece = new Piece('black',2);
    }

    ngAfterViewInit() {
        // TODO: particlesJS config should be loaded with consideration of screen size
        window['particlesJS'].load('page-home-content', 'assets/config/particles.json', function() {
            console.log('callback - particles.js config loaded');
        });
        console.log(this.thepiece);
    }

}

let Piece = function(side,colorIndex) {
    this.side = side;
    this.colorIndex = colorIndex;
}

let BoardSquare = function(piece,selectedBy,component,isDisturbed) {
    this.piece = piece;
    this.selectedBy = selectedBy;
    this.component = component;
    this.isDisturbed = isDisturbed;
}
