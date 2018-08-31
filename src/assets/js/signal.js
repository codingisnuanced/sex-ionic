window.onload = ()=> {
    let iframe = window.frameElement;
    let canvas = document.getElementById("signal-canvas");
    canvas.width = parseInt(iframe.getAttribute("drawWidth"));
    canvas.height = parseInt(iframe.getAttribute("drawHeight"));
    let ctx = canvas.getContext('2d');
    let adjustable = iframe.getAttribute("adjustable") === "true" ? true : false;
    let thesignal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["0.60", "0.97", "0.15", "0.25", "0.10", "0.15"],
            datasets: [{
                label: '',
                data: [0.6, 0.97, 0.15, 0.25, 0.1, 0.15],
                backgroundColor: 'rgba(235,235,235,0.27)',
                borderColor: 'rgba(100,100,100,0.4)',
                borderWidth: 1,
                lineTension: 0,
                pointBackgroundColor: ['tomato','yellow','mediumspringgreen','orange','fuchsia','dodgerblue'],
                pointBorderColor: 'rgba(0,0,0,0)',
                pointHitRadius: 20

            }]
        },
        options: {
            responsive: false,
            dragData: adjustable,
            scales: {
                xAxes: [{
                    ticks: {
                        autoSkip: false,
                        fontSize: 9,
                        fontFamily: "'Times New Roman', serif"
                    },
                    gridLines: {
                        display: true
                    }
                }],
                yAxes: [{
                    ticks: {
                        min: 0,
                        max: 1,
                        fontSize: 9,
                        fontFamily: "'Times New Roman', serif"
                    },
                    gridLines: {
                        display: true
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                enabled: false
            },
            onDragStart: (e,info)=> {
                if(adjustable) {
                    console.log(e,info._index);
                    // post message to update color-number quads
                }
            },
            onDrag: (e,datasetIndex, index, value)=> {
                if(adjustable) {
                    console.log(e,datasetIndex,index,value);
                    thesignal.data.labels[index] = ''+Math.round(value*100)/100;
                    thesignal.update();
                }
            },
            onDragEnd: (e,datasetIndex, index, value)=> {
                if(adjustable) {
                    console.log(e,datasetIndex,index,value);
                    thesignal.data.labels[index] = ''+Math.round(value*100)/100;
                    thesignal.update();
                }
            }
        }
    });

    let postsignalupdate = (index,value)=> {
    }
}
