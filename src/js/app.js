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
		}, 
		zoomableData = {before:'overview', zoomIn: (value) =>{ 
			const date = (new Date(value)).toJSON();
			return `${date.slice(0, 7)}/${date.slice(8,10)}`; 
		}},
		chartViews = [
			{
				id: 'chart1',
				title: 'Follower',
				dataPath: 'data/1/',
				dataParams: zoomableData
			},
			{
				id: 'chart2',
				title: 'Interactions',
				dataPath: 'data/2/',
				dataParams: zoomableData
			},
			{
				id: 'chart3',
				title: 'Messages',
				dataPath: 'data/3/',
				dataParams: zoomableData
			},
			{
				id: 'chart4',
				title: 'Views',
				dataPath: 'data/4/',
				dataParams: zoomableData
			},
			{
				id: 'chart5',
				title: 'Apps',
				dataPath: 'data/5/',
				dataParams: {before:'overview'}
			}
		];
	for(const view of chartViews) {
		// eslint-disable-next-line no-undef
		window[view.id] = new ChartView(view.id, view.title, params, new DataLoader(view.dataPath, view.dataParams));
	}
	window.switchMode = function () {
		let mode = document.getElementById('mode').innerText.toLowerCase();
		if (mode === 'night') {
			document.getElementsByTagName('body')[0].className = 'night';
			document.getElementById('mode').innerText = 'Day';
		} else {
			document.getElementsByTagName('body')[0].className = 'day';
			document.getElementById('mode').innerText = 'Night';
		}
		for(const view of chartViews) {
			window[view.id].updateColors();
		}
	};
});