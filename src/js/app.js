/* app.js */
'use strict';
window.addEventListener('load', () => {
	const params = {
		devicePixelRatio: 1,
		valueToString: (val, short) => {
			var date = new Date(val).toDateString();
			if (short) {
				return date.slice(4, date.length - 5);	
			}
			return date.slice(0, 3) + ', ' + date.slice(4);
		},
		debug:false
	};

	const zoomableData = {before:'overview', zoomIn: (value) =>{ 
		const date = (new Date(value)).toJSON();
		return `${date.slice(0, 7)}/${date.slice(8,10)}`; 
	}};
	// eslint-disable-next-line no-undef
	window.chartView1 = new ChartView('chart1', 'Followers', params, new DataLoader('data/1/', zoomableData));

	// eslint-disable-next-line no-undef
	window.chartView2 = new ChartView('chart2', 'Interactions', params, new DataLoader('data/2/',zoomableData));

	// eslint-disable-next-line no-undef
	window.chartView3 = new ChartView('chart3', 'Messages', params, new DataLoader('data/3/', zoomableData));

	// eslint-disable-next-line no-undef
	window.chartView4 = new ChartView('chart4', 'Views', params, new DataLoader('data/4/', zoomableData));

	// eslint-disable-next-line no-undef
	window.chartView5 = new ChartView('chart5', 'Apps', params, new DataLoader('data/5/', {before:'overview'}));

	window.switchMode = function () {
		let mode = document.getElementById('mode').innerText.toLowerCase();
		if (mode === 'night') {
			document.getElementsByTagName('body')[0].className = 'night';
			document.getElementById('mode').innerText = 'Day';
		} else {
			document.getElementsByTagName('body')[0].className = 'day';
			document.getElementById('mode').innerText = 'Night';
		}
		window.chartView1.updateColors();
		window.chartView2.updateColors();
		window.chartView3.updateColors();
		window.chartView4.updateColors();
		window.chartView5.updateColors();
	};
});