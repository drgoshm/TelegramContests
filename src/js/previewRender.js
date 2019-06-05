/* previewRender.js */

// eslint-disable-next-line no-unused-vars
const PreviewRender = function(canvas, chart, dpr, anim, params) {
	let width = canvas.width, height = canvas.height, yArea = height;
	this.XScale = 0;
	this.YScale = 0;
	this.iBegin = 0;
	this.iEnd = 0;
	this.piemode = false;

	const ctx = canvas.getContext('2d'),
		lineRender = (column, colIndex) => {
			ctx.beginPath();
			ctx.lineWidth = params.prvLnWidth;
			ctx.lineJoin = 'round';
			ctx.strokeStyle = column.color;
			ctx.globalAlpha = column.opacity;
			chart.forEachX((value, index) => {			
				let x = (value - chart.getX(this.iBegin)) * this.XScale,
					y = chart.getYValue(colIndex, index) - this.YMin;
				if (index == 0)
					ctx.moveTo(x, yArea - y*this.YScale);
				else
					ctx.lineTo(x, yArea - y*this.YScale);
			}, this.iBegin, this.iEnd);
			ctx.stroke();
			ctx.globalAlpha = 1;
		},
		barRender = (column, colIndex) => {
			const count = this.iEnd - this.iBegin,
				barWidth = width/count/2;
			ctx.beginPath();
			ctx.fillStyle = column.color;
			ctx.moveTo(width, yArea);
			ctx.lineTo(0, yArea);
			chart.forEachX((value, index) => {			
				let x =  (value - chart.getX(this.iBegin)) * this.XScale, 
					y = chart.getYValue(colIndex, index);
				ctx.lineTo(x - barWidth, yArea - y * this.YScale);
				ctx.lineTo(x + barWidth, yArea - y * this.YScale);
			}, this.iBegin, this.iEnd);
			ctx.closePath();
			ctx.fill();
		},
		areaRender = (column, colIndex) => {
			ctx.lineWidth = params.prvLnWidth;
			ctx.fillStyle = ctx.strokeStyle = column.color;
			ctx.beginPath();
			ctx.moveTo(width, yArea);
			ctx.lineTo(0, yArea);	
			chart.forEachX((value, xIndex) => {	
				let x = (value - chart.getX(this.iBegin)) * this.XScale, 
					y = chart.getYValue(colIndex, xIndex);
				ctx.lineTo(x, yArea - yArea * y);	
			}, this.iBegin, this.iEnd);
			ctx.closePath();
			ctx.fill();
		},
		pieRender = (column, colIndex) => {
			const count = this.iEnd - this.iBegin,
				barWidth = width/count;
			ctx.beginPath();
			ctx.fillStyle = column.color;
			ctx.moveTo(width, yArea);
			ctx.lineTo(0, yArea);
			chart.forEachX((value, index) => {			
				let x =  (value - chart.getX(this.iBegin)) * this.XScale, 
					y = chart.getYValue(colIndex, index);
				ctx.lineTo(x, yArea - yArea * y);
				ctx.lineTo(x + barWidth, yArea - yArea * y);
			}, this.iBegin, this.iEnd);
			ctx.closePath();
			ctx.fill();
		};
	let flag = true;
	ctx.imageSmoothingEnabled = true;

	this.setXAxis = (begin, end) => {
		this.iBegin = begin || 0;
		this.iEnd = end || chart.getLength()-1;
		this.xRange = chart.getXRange(this.iBegin, this.iEnd);
		this.XScale = width / this.xRange;
		flag = true;
		return this;
	};

	this.setYAxis = () => {
		let minMax = chart.getMinMaxValue(this.iBegin, this.iEnd, 6 ,0);
		this.YMin = minMax.min;
		this.YScale = yArea / minMax.sub;
		flag = true;
		return this;
	};

	this.refreshBy = (time) => {
		anim.add('PR_refresh', time)
			.timing('circ', 'out')
			.tick(()=>{
				flag = true;
			})
			.after(() => {
				flag = true;
			})
			.run();
	};

	this.prepare = () => {
		ctx.clearRect(0, 0, width, height);
	};

	this.render = (column, index) => {
		if(!column || column.opacity === 0) return;
		if(this.piemode) {
			pieRender(column, index);
			return;
		}
		if(column.type === 'line') {
			lineRender(column, index);
		}
		if(column.type === 'bar') {
			barRender(column, index);
		}
		if(column.type === 'area') {
			areaRender(column, index);
		}
	};

	this.finally = () => {
		flag = false;
	};
	this.refresh = () => flag = true;
	this.resize = () => {
		const rect = {width: canvas.parentElement.clientWidth, height: canvas.parentElement.clientHeight};
		canvas.setAttribute('width',rect.width);			
		canvas.setAttribute('height',rect.height);
		width = rect.width;
		height = rect.height;
		yArea = rect.height;
		flag = true;
	};
	this.flag = () => flag;
};
