window.onload = ()=> {

    let ctx = document.getElementById("white-target-signal-canvas").getContext('2d');
    let tgChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["0.60", "0.97", "0.15", "0.25", "0.10", "0.15"],
            datasets: [{
                label: '',
                data: [0.6, 0.97, 0.15, 0.25, 0.1, 0.15],
                backgroundColor: 'rgba(235,235,235,0.2)',
                borderColor: 'rgba(100,100,100,0.4)',
                borderWidth: 1,
                lineTension: 0,
                pointBackgroundColor: ['red','blue','yellow','green','purple','orange'],
                pointBorderColor: 'rgba(0,0,0,0)',
                pointHitRadius: 15

            }]
        },
        options: {
            responsive: false,
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
                    },
                    scaleLabel: {
                        fontSize: 9,
                        fontFamily: "'Times New Roman', serif"
                    }
                }]
            },
            legend: {
                display: false
            },
            tooltips: {
                enabled: false
            }

        }
    });
}
