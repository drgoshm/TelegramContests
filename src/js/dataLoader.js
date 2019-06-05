/* data_loader.js */
// eslint-disable-next-line no-unused-vars
const DataLoader = function(uri, params) {
	this.xhr = new XMLHttpRequest();
	this.xhr.onreadystatechange = () => {
		if (this.xhr.readyState === 4 && this.xhr.status === 200) {
			if(typeof this.onload === 'function') this.onload(JSON.parse(this.xhr.responseText), this.zoomRequest);
			this.zoomRequest = false;
		}
	};
	this.uri = uri;
	this.path = '';
	this.before = params.before;
	this.zoomIn = params.zoomIn;
};

DataLoader.prototype = {
	pull: function(path) {
		this.path = path;
		this.xhr.open('GET', this.uri + path, true);
		this.xhr.send();
	},
	getZoom: function(value) {
		this.zoomRequest = true;
		this.pull(this.zoomIn(value) + '.json');
	},
	setOnloadEvent: function(cb) {
		this.onload = cb;
		if(this.before)
			this.pull(this.before + '.json');
	}
};
