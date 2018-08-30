import { Component, ElementRef, ViewChild } from '@angular/core';
import { MenuController } from 'ionic-angular';
import * as HighCharts from "highcharts";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

    @ViewChild('blackTargetSignalCanvas') blackTargetSignalCanvas: ElementRef;
    @ViewChild('blackScoreSignalCanvas') blackScoreSignalCanvas: ElementRef;
    @ViewChild('whiteTargetSignalCanvas') whiteTargetSignalCanvas: ElementRef;
    @ViewChild('whiteScoreSignalCanvas') whiteScoreSignalCanvas: ElementRef;

    // @ViewChild('blackTargetSignal') blackTargetSignal: ElementRef;

    constructor(public menu: MenuController) {
        menu.enable(true);
    }

    ngAfterViewInit() {
        // window['particlesJS'].load('page-home-content', 'assets/config/particles.json', function() {
        //     console.log('callback - particles.js config loaded');
        // });
        // setupSignal(this.blackTargetSignal.nativeElement);
        setupTargetSignal(this.blackTargetSignalCanvas.nativeElement,1,1);
        setupTargetSignal(this.blackScoreSignalCanvas.nativeElement,1,1);
        setupTargetSignal(this.whiteTargetSignalCanvas.nativeElement,-1,-1);
        setupTargetSignal(this.whiteScoreSignalCanvas.nativeElement,1,1);
    }

}

let setupSignal = (sigid)=> {
    sigid.innerHTML = sigid.innerHTML+chartTemplate();
}

let chartTemplate = ()=> {
    return `
        <div class="signal-canvas">
            <div class="grid-container">
                <div class="fifth"></div>
                <div class="fifth"></div>
                <div class="fifth"></div>
                <div class="fifth"></div>
                <div class="fifth"></div>
            </div>
            <p>Hello</p>
        </div>
        `
}

let setupTargetSignal = (canvas,hsc,vsc)=> {
    // let ctx = canvas.getContext('2d');
    // let tgChart = new Chart(ctx, {
    //     type: 'line',
    //     data: {
    //         labels: ["0.60", "0.97", "0.15", "0.25", "0.10", "0.15"],
    //         datasets: [{
    //             label: '',
    //             data: [0.6, 0.97, 0.15, 0.25, 0.1, 0.15],
    //             backgroundColor: 'rgba(235,235,235,0.2)',
    //             borderColor: 'rgba(100,100,100,0.4)',
    //             borderWidth: 1,
    //             lineTension: 0,
    //             pointBackgroundColor: ['red','blue','yellow','green','purple','orange'],
    //             pointBorderColor: 'rgba(0,0,0,0)',
    //             pointHitRadius: 15
    //
    //         }]
    //     },
    //     options: {
    //         responsive: false,
    //         scales: {
    //             xAxes: [{
    //                 ticks: {
    //                     autoSkip: false,
    //                     fontSize: 9,
    //                     fontFamily: "'Times New Roman', serif"
    //                 },
    //                 gridLines: {
    //                     display: true
    //                 }
    //             }],
    //             yAxes: [{
    //                 ticks: {
    //                     min: 0,
    //                     max: 1,
    //                     fontSize: 9,
    //                     fontFamily: "'Times New Roman', serif"
    //                 },
    //                 gridLines: {
    //                     display: true
    //                 },
    //                 scaleLabel: {
    //                     fontSize: 9,
    //                     fontFamily: "'Times New Roman', serif"
    //                 }
    //             }]
    //         },
    //         legend: {
    //             display: false
    //         },
    //         tooltips: {
    //             enabled: false
    //         }
    //
    //     }
    // });
}
