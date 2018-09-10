window.onload = ()=> {
    let iframe = window.frameElement;
    let canvas = document.getElementById("signal-canvas");
    canvas.width = parseInt(iframe.getAttribute("drawWidth"));
    canvas.height = parseInt(iframe.getAttribute("drawHeight"));
    let ctx = canvas.getContext('2d');
    let adjustable = iframe.getAttribute("adjustable") === "true" ? true : false;
    let events = adjustable ? ["mousemove", "mouseout", "click", "touchstart", "touchmove", "touchend"] : []
    let signalType = iframe.getAttribute('signalType'),
        side = iframe.getAttribute('side');
    let theSignal = null,
        chartOptions = {
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
                    pointBackgroundColor: ['Red','MediumSpringGreen','Orange','DodgerBlue','Yellow','Fuchsia'],
                    pointBorderColor: 'rgba(0,0,0,0)',
                    pointHitRadius: 20

                }]
            },
            options: {
                animation: {
                    duration: signalType === 'target' || signalType === 'score' ? 1000 : 0
                },
                events: events,
                responsive: false,
                dragData: false,
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
                    if(adjustable === false) return;

                    window.parent.postMessage({
                        index: info._index,
                        value: theSignal.data.datasets[0].data[info._index],
                        isStart: true
                    }, '*');
                },
                onDrag: (e,datasetIndex, index, value)=> {
                    if(adjustable === false) return;

                    theSignal.data.labels[index] = ''+Math.round(value*100)/100;
                    theSignal.update();
                    window.parent.postMessage({
                        index: index,
                        value: value
                    }, '*');
                },
                onDragEnd: (e,datasetIndex, index, value)=> {
                    if(adjustable === false) return;

                    theSignal.data.labels[index] = ''+Math.round(value*100)/100;
                    theSignal.update();
                    window.parent.postMessage({
                        index: index,
                        value: value,
                        isEnd: true
                    }, '*');
                }
            }
        }

    let handleMessage = (e)=> {
        Object.keys(e.data).forEach((k)=> {
            switch (k) {
                case 'labels':
                    theSignal.data.labels = e.data.labels;
                    theSignal.update();
                    break;
                case 'dragData':
                    chartOptions.options.dragData = e.data.dragData;
                    theSignal.destroy();
                    theSignal = new Chart(ctx, chartOptions);
                    break;
                case 'data':
                    theSignal.data.datasets[0].data = e.data.data;
                    theSignal.update();
                    break;
                default:
                    return;
            }
        });
    }

    window.addEventListener('message', handleMessage);
    theSignal = new Chart(ctx, chartOptions);
    window.parent.postMessage({
        side: side,
        signalType: signalType,
        frameReady: true
    }, '*');
}
