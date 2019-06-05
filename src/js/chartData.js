'use strict';

// eslint-disable-next-line no-unused-vars
const ChartData = function() {
	
	const 	binSearch = (arr, value) => {
			let start = 0;
			let stop = arr.length - 1;
			let m = ~~((start + stop) / 2);
			while (arr[m] !== value && start < stop) {
				if (value < arr[m]) {
					stop = m - 1;
				} else {
					start = m + 1;
				}
				m = ~~((start + stop) / 2);
			}
			return (arr[m] !== value) ? -1 : m;
		},
		binSearchFloor = (arr, value) => {
			let start = 0;
			let stop = arr.length - 1;
			let m = ~~((start + stop) / 2);
			while (arr[m] !== value && start < stop) {
				if (value < arr[m]) {
					stop = m - 1;
				} else {
					start = m + 1;
				}
				m = ~~((start + stop) / 2);
			}
			return (arr[m] <= value) ? m : ( m===0 ? 0 : m-1);
		},
		binSearchCloser = (arr, value) => {
			let start = 0;
			let stop = arr.length - 1;
			let m = ~~((start + stop) / 2);
			while (arr[m] !== value && start < stop) {
				if (value < arr[m]) {
					stop = m - 1;
				} else {
					start = m + 1;
				}
				m = ~~((start + stop) / 2);
			}

			if(arr[m] == value) return m;
			if(arr[m] > value) return (arr[m]-value)<=(arr[m-1]-value) ? m : m-1;
			if(arr[m] < value) return (arr[m]-value)<=(arr[m+1]-value) ? m : m+1;
			return -1;
		};// TODO: neeeed refactoring

	const Data = function(){
			this.XMin = 0; // Infinity
			this.XMax = 1;
			this.YMin = 1e309; // Infinity
			this.YMax = 1;
			this.X = [];
			this.X_labels = [];
			this.columns = [];
			this.percentageSum = [];
			this.stacked = false;
			this.y_scaled = false;
			this.percentage = false;
			this.count = 0;
		},
		sumByX = (xIndex, toColumn ) => {
			toColumn = toColumn || this.data.columns.length - 1;
			let sum = 0;
			for(let i = 0; i <= toColumn; i++) {
				sum += this.data.columns[i].values[xIndex] * this.data.columns[i].opacity;
			}
			return sum;
		};

	this.data = new Data();
	this.cache = [];

	this.setData = (data, xValToStr = undefined) => {
		this.data.stacked = data.stacked || false;
		this.data.y_scaled = data.y_scaled || false;
		this.data.percentage = data.percentage || false;
		let scale_base = 0;

		for (let i = 0; i<data.columns.length;i++) {
			const column = data.columns[i], id = column[0];
			if (data.types[id] === 'x') {
				this.data.X = column.slice(1);
				this.data.XMin = this.data.X[0];
				this.data.XMax = this.data.X[this.data.X.length - 1];
				if(xValToStr)
					this.data.X_labels = this.data.X.map(v => xValToStr(v,true));
				continue;
			}
			const newColumn = {
				id: id,
				values: column.slice(1),
				name: data.names[id],
				type: data.types[id],
				color: data.colors[id],
				YMin: 1e309,
				YMax: 0,
				visible: true,
				opacity: 1,
			};

			newColumn.YMin = Math.min.apply(null, newColumn.values);
			newColumn.YMax = Math.max.apply(null, newColumn.values);

			if(this.data.y_scaled) {
				if(!scale_base) {
					newColumn.y_scale = 1;
					scale_base = newColumn.YMax - newColumn.YMin;
				} else {
					newColumn.y_scale = scale_base / (newColumn.YMax - newColumn.YMin);
				}
			}
			this.data.columns.push(newColumn);
		}
		this.data.count = this.data.columns.length;
	};
	
	this.pushCache = () => {
		this.cache.push(this.data);
	};
	
	this.popCache = () => {
		this.data = this.cache.pop();
	};

	this.clearData = () => {
		this.data = new Data();
	};

	this.findX = (X) => {
		return binSearch(this.data.X, X);
	};
	
	this.getFloorX = (X) => {
		return binSearchFloor(this.data.X, X);
	};

	this.getCloserX = (X) => {
		return binSearchCloser(this.data.X, X);
	};

	this.getSumYValues = (xIndex) => {
		return sumByX(xIndex);
	};

	this.getYValue = (colIndex, xIndex) => {
		if(this.data.stacked) {
			if(this.data.percentage) {
				if(colIndex == 0) {
					return this.data.columns[colIndex].values[xIndex] * this.data.columns[colIndex].opacity / sumByX(xIndex);
				} 		
				return sumByX(xIndex, colIndex) / sumByX(xIndex);
			}
			if(colIndex == 0) {
				return this.data.columns[colIndex].values[xIndex] * this.data.columns[colIndex].opacity;
			} 	
			return sumByX(xIndex, colIndex);
		}
		if(this.data.y_scaled) {
			return this.data.columns[colIndex].values[xIndex] * this.data.columns[colIndex].y_scale; 	
		}
		return this.data.columns[colIndex].values[xIndex]; 
	};

	this.getMinMaxValue = (begin, end, defaultMax = 6, defaultMin = 0) => {
		if(this.data.percentage) return {min: 0, max: 1, sub: 1};

		begin = begin || 0; 
		end = end || this.data.X.length - 1;
		let min = 1e309, max = defaultMax;
		this.forEachColumn((column, colIndex) => {
			this.forEachX((value, xIndex) => {
				if(this.data.stacked) {
					if(colIndex == this.data.columns.length - 1) {
						let y  =this.getYValue(colIndex, xIndex);
						min = 0;
						max = Math.max(max, y);
					}
					return;
				} 
				if(this.data.y_scaled) {
					if(colIndex == 0) {
						let y  =this.getYValue(colIndex, xIndex);
						min = Math.min(min, y);
						max = Math.max(max, y);
					}
					return;
				}
				let y  =this.getYValue(colIndex, xIndex);
				min = Math.min(min, y);
				max = Math.max(max, y);
			}, begin, end);
		});
		if(!isFinite(min)) min = defaultMin;

		return {min, max, sub: max - min};
	};

	this.getXRange = (begin, end) => {
		if(begin!=undefined&&end!=undefined) {
			return this.data.X[end] - this.data.X[begin];
		}
		return this.data.XMax - this.data.XMin;
	};

	this.forEachColumn = (callback, backward = true) => {
		if(backward)
			for(let i = this.data.columns.length;i--;) {
				callback(this.data.columns[i], i, this.data.columns);
			}
		else 
			for(let i = 0;i < this.data.columns.length;i++) {
				callback(this.data.columns[i], i, this.data.columns);
			}
	};

	this.forEachX = (callback, from = 0, to = undefined) => {
		to = to || this.data.X.length;
		for(let i = from; i <= to; i++) {
			if(this.data.X[i] !== undefined)
				callback(this.data.X[i], i);
		}
	};

	this.getX = (index) => {
		return this.data.X[index];
	};

	this.getLength = () => {
		return this.data.X.length;
	};

	this.getXLabel = (index) => {
		return this.data.X_labels[index];
	};
};