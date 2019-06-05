(function(context) {
	context.Anim = function(){
		const _setValue = (o, p, v) => !o || !o.hasOwnProperty(p) || (o[p] = v),
			timings = {
				'linear': p => p,
				'circ': p => p < 0 ? 0 : p > 1 ? 1 : 1 - Math.sin(Math.acos(p)),
				'bounce': p =>  { for (let a = 0, b = 1; 1; a += b, b /= 2) {
					if (p >= (7 - 4 * a) / 11) {
						return -Math.pow((11 - 6 * a - 11 * p) / 4, 2) + b * b;
					}
				}},
				'elastic': p => Math.pow(2, 20 * (p - .8)) * Math.cos( 6 * p * p- 6) / 16
			},
			ease = {
				'in': f => f,
				'out': (f) => (p) => 1 - f(1 - p),
				'both': (f) => (p) => p < .5 ? f(2 * p) / 2 : (2 - f(2 * (1 - p))) / 2
			};
		this.add = function (id, duration) {
			if(id == 'update' || id == 'add' || id == 'loop' || typeof duration !== 'number') return;
			const a = {
					duration: duration,
					progress: 0,
					started: false,
					timing: timings['linear'],
					ease: ease['in'],
					run: () => {this.started = true; this.timeStart = Date.now();}
				},
				r = {anim: this, 
					timing: (t, e = 'in') => {
						a.timing = typeof t === 'function' ? t : timings[t] || timings['linear'];
						a.ease = ease[e] || ease['in'];
						return r;
					},
					for: (obj, prop) => {
						a.object = obj;
						a.property = prop;
						return r;
					},
					from: (v) => {
						a.from = v;
						return r;
					},
					to: (v) => {
						a.to = v;
						return r;
					},
					tick: (tick) => {
						a.tick = tick;
						return r;
					},
					after: (after) => {
						a.after = after;
						return r;
					},
					run: () => {
						a.started = true;
						a.timeStart = Date.now();
						return r;
					}
				};
			this[id] = a;
			return r;
		};
		this.update = function (t) {
			let r = false;
			for (let index in this) {
				const f = this[index];
				if (typeof f !== 'object') continue;
				if(!f.started) {
					f.timeStart = t - f.duration * f.progress;
					continue;
				}
				f.progress = (t - f.timeStart) / f.duration;
				r = true;
				if (f.progress >= 1 || isNaN(f.progress) || (typeof f.from === 'number' && f.from === f.to)) {
					if (typeof f.to === 'number') _setValue(f.object, f.property, typeof f.tick === 'function' ? f.tick(f.to) || f.to : f.to);
					if (typeof f.after === 'function') 	f.after.call(this);
					delete this[index];
					continue;
				}
				const value = typeof f.from === 'number' && typeof f.to === 'number' ? (f.to - f.from) * f.ease(f.timing)(f.progress) + f.from : f.ease(f.timing)(f.progress);
				_setValue(f.object, f.property, typeof f.tick === 'function' ? f.tick(value, f.from, f.to) || value : value);
			}
			return r;
		};
		this.loop = function(){
			this.update(Date.now());
			window.setTimeout(this.loop.bind(this), 1e3 / 60);
		};
	};
// eslint-disable-next-line no-undef
})(typeof exports === 'undefined' ? window : exports);
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
const CanvasHelper = () => {



};

CanvasHelper.prototype = {
    
};
'use strict';

// eslint-disable-next-line no-unused-vars
const ChartData = function() {
	if ('WebAssembly' in window) {
	
		let wasm, wasm_module;

		this.data = {
			X_labels: [],
			columns: []
		};
		this.env = 
		{
			callback: (value, index) => {console.log(value);}
		};
		this.setData = (data, xValToStr = undefined) => {
			fetch('/js/chart.wasm')
				.then(response => response.arrayBuffer())
				.then(bits => WebAssembly.compile(bits))
				.then(module => { return new WebAssembly.instantiate(module, this);})
				.then(instance => {
					console.log(instance);
					wasm = instance;
					wasm.exports.setFlags(data.stacked || false, data.y_scaled || false, data.percentage || false);
					let scale_base = 0;
			
					for (let i = 0; i<data.columns.length;i++) {
						const column = data.columns[i], id = column[0];

						if (data.types[id] === 'x') {
							this.data.X_labels = column.slice(1).map(x => { 
								wasm.exports.pushX(x); 
								return xValToStr ? xValToStr(x, true) : '';
							});
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
			
						if(wasm.exports.isYScaled()) {

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
				
				})
				// eslint-disable-next-line no-console
				.catch(console.error);
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

		this.getXRange = () => {

		};
		this.getMinMaxValue = () => {
			return {min:0, max: 0};
		};
		this.getFloorX = () => {

		};
		this.forEachColumn = () => {

		};
		this.forEachX = (callback, from = 0, to = undefined) => {
			to = to || -1;
			if(wasm) {
				try{
				//WebAssembly.Module.cwrap('passFnPointer', 'undefined', ['number'])(WebAssembly.Module.addFunction(callback))
					this.env.callback = callback;
					wasm.exports.forEachX(callback, from, to);
				}
				catch(err) {
					console.error(err);
					let t = Date.now();
					while(t + 2000 > Date.now()){}
				}
			}
		};

		this.getX = (index) => {
			if(wasm)
				return wasm.exports.getX(index);
			else 0;
		};
	
		this.getLength = () => {
			if(wasm)
				return wasm.exports.getLengthX();
			else 0;
		};
	
		this.getXLabel = (index) => {
			return this.data.X_labels[index];
		};
		return;
	}

	/* NO-WEBASSEMBLY-SUPPORT */
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
/* chartRender.js */

// eslint-disable-next-line no-unused-vars
const ChartRender = function(canvas, chart, dpr, anim, params) {
	let height = canvas.height, 
		width = canvas.width, 
		yArea = height - params.fntAxesSize - 10*dpr, 
		centerX = width / 2,
		centerY = height / 2;
	const ctx = canvas.getContext('2d'),
		numberFormat = (n) => {
			const abs = Math.abs(n);
			if (abs > 1e9) return (n / 1e9).toFixed(2) + 'B';
			if (abs > 1e6) return (n / 1e6).toFixed(2) + 'M';
			if (abs > 1e3) return (n / 1e3).toFixed(1) + 'K';
			return n.toFixed(0);
		},
		gradation = (value, isMin = false) => {
			if(isMin) return value*0.8;
			return value*1.2;
		},
		text = (value, x, y, alpha = 1) => {
			ctx.globalAlpha = alpha;
			ctx.fillText(value, x, y);
			ctx.globalAlpha = 1;
		},
		line = (fromX, fromY, toX, toY) => {ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY);},
		debugRender = () => {
			ctx.textAlign = 'right';
			ctx.strokeStyle = ctx.fillStyle = '#000';
			text(`[${canvas.width} x ${canvas.height}]`, width, 10, 1);
			ctx.textAlign = 'left';
			ctx.imageSmoothingEnabled = true;
			text(`cols: ${chart.data.count}  yMin:  ${chart.data.YMin} yMax:  ${chart.data.YMax} ( ${chart.getMinMaxValue().sub}) [${chart.data.stacked ? ' stacked |' : ''}${chart.data.y_scaled ? ' y_scaled |' : ''}${chart.data.percentage ? ' percentage' : ''} ]`, 10, 20*dpr, .8);

			if(pie.active) {
				text(`Xrange: ${pie.iBegin}-${pie.iEnd} at  ${chart.data.X.length}  Sum: ${pie.sum.toFixed(8)} `, 10, 32*dpr, .8);
				//text(`Yrange: ${numberFormat(y_range.min)}-${numberFormat(y_range.max)} YScale: ${y_range.YScale}` , 10, 44*dpr, 1);
			} else {
				text(`Xrange: ${x_range.iBegin}-${x_range.iEnd} at  ${chart.data.X.length}  XScale: ${x_range.XScale.toFixed(8)} skipF: ${x_range.skipFactor}`, 10, 32*dpr, .8);
				text(`Yrange: ${numberFormat(y_range.min)}-${numberFormat(y_range.max)} YScale: ${y_range.YScale}` , 10, 44*dpr, 1);
			}
			if(selectedX.selected) {
				text(`X: ${numberFormat(selectedX.xValue)} i: ${selectedX.index}` , 10, 56*dpr, 1);
			} 

			let offset = 0;

			chart.forEachColumn((column) => {
				ctx.strokeStyle = ctx.fillStyle = column.color;
				text(`id: ${column.id} ( ${column.type} ) yMin:  ${column.YMin}  yMax:  ${column.YMax}` + (chart.data.y_scaled ? ` scale: ${column.y_scale}` : ''), 10, (70 + offset)*dpr, 1);
				offset += 14;
			});
		},
		gridRender = () => {
			let levelHeigth = chart.data.percentage ? (yArea - topOffset)/4 : yArea/6;
			ctx.beginPath();
			ctx.strokeStyle = params.lineAxesColor;
			ctx.lineWidth = 1*dpr;
			for(let y = yArea; y >= 0; y -= levelHeigth) {
				line(0, ~~y, width, ~~y);
			}
			ctx.stroke();
		},
		xAxisRender = () => {
			let y = yArea + params.fntAxesSize + 2*dpr;
			ctx.strokeStyle = ctx.fillStyle = params.fntAxesColor;
			ctx.textAlign = 'center';
			chart.forEachX((value, index) => {
				let x = (value - x_range.begin)*x_range.XScale;

				if(selectedX.selected&&selectedX.index == index) {
					ctx.beginPath();
					ctx.strokeStyle = params.lineAxesColor;
					ctx.lineWidth = 1*dpr;
					line(x, 0, x, yArea);
					ctx.stroke();
				}

				if(x_range.skipFactor >= 1) {
					let localFactor = index % x_range.skipFactor;
					if (anim.CR_xrange_skipAlpha_fadeOut && localFactor == x_range.skipFactor / 2) {
						ctx.measureText(chart.getXlabel(0), 0, 0, params.fntAxesSize).width;
						text(chart.getXlabel(index), x, y, x_range.skipAlpha);

						if(params.debug) {
							ctx.beginPath();
							ctx.strokeStyle = '#FF0000';
							ctx.lineWidth = 1*dpr;
							line(x, 0, x, yArea);
							ctx.stroke();
						}

						return;
					}
					if (anim.CR_xrange_skipAlpha_fadeIn && (index % (x_range.skipFactor * 2) == x_range.skipFactor)) {
						text(chart.getXlabel(index), x, y, x_range.skipAlpha);

						if(params.debug) {
							ctx.beginPath();
							ctx.strokeStyle = '#00FF00';
							ctx.lineWidth = 1*dpr;
							line(x, 0, x, yArea);
							ctx.stroke();
						}

						return;
					}
					
					if (localFactor != 0) return;
				}

				if(params.debug) {
					ctx.beginPath();
					ctx.strokeStyle = params.lineAxesColor;
					ctx.lineWidth = 1*dpr;
					line(x, 0, x, yArea);
					ctx.stroke();
				}


				text(chart.data.X_labels[index], x, y, 1);
				if(params.debug) {
					ctx.beginPath();
					ctx.strokeStyle = '#0000FF';
					ctx.lineWidth = 2*dpr;
					line(x - x_range.textWidth / 2, y, x + x_range.textWidth / 2, y);
					ctx.stroke();
				}

			}, x_range.iBegin, x_range.iEnd );
		},
		yAxisRender = () => {
			ctx.textAlign = 'left';
			if(chart.data.y_scaled) 
				ctx.strokeStyle = ctx.fillStyle = chart.data.columns[0].color;
			else 
				ctx.strokeStyle = ctx.fillStyle = params.fntAxesColor;
			let levels  = 6,
				levelHeigth = yArea/levels;
			for (let i = levels; i--;) {
				let val = (y_range.max - y_range.min) / levels  * i + y_range.min,
					y = yArea - levelHeigth * (i);
				if(anim.CR_yRange) {
					const from = (anim.CR_yRange.from.max - anim.CR_yRange.from.min)/levels * i + anim.CR_yRange.from.min,//anim.CR_yRange.from / levels * i,
						to = (anim.CR_yRange.to.max - anim.CR_yRange.to.min)/levels * i + anim.CR_yRange.to.min, //anim.CR_yRange.to / levels * i,
						sign = Math.sign(to - from); 
					text(numberFormat(from), 2*dpr, y - 2*dpr + sign * levelHeigth * anim.CR_yRange.progress, 1 - anim.CR_yRange.progress);
					text(numberFormat(to), 2*dpr, y - 2*dpr - sign * (levelHeigth - levelHeigth * anim.CR_yRange.progress), anim.CR_yRange.progress);
				} else {
					text(numberFormat(val), 2*dpr, y - 2*dpr, 1);
				}
			}
			if(chart.data.y_scaled) {
				ctx.textAlign = 'right';
				ctx.strokeStyle = ctx.fillStyle = chart.data.columns[1].color;
				for (let i = levels; i--;) {
					let val = (y_range.max - y_range.min)/chart.data.columns[1].y_scale / levels  * i + y_range.min/chart.data.columns[1].y_scale,
						y = yArea - levelHeigth * (i);
					if(anim.CR_yRange) {
						const from = (anim.CR_yRange.from.max - anim.CR_yRange.from.min)/levels * i + anim.CR_yRange.from.min,//anim.CR_yRange.from / levels * i,
							to = (anim.CR_yRange.to.max - anim.CR_yRange.to.min)/levels * i + anim.CR_yRange.to.min, //anim.CR_yRange.to / levels * i,
							sign = Math.sign(to - from); 
						text(numberFormat(from), width - 2*dpr, y - 2*dpr + sign * levelHeigth * anim.CR_yRange.progress, 1 - anim.CR_yRange.progress);
						text(numberFormat(to),width -  2*dpr, y - 2*dpr - sign * (levelHeigth - levelHeigth * anim.CR_yRange.progress), anim.CR_yRange.progress);
					} else {
						text(numberFormat(val),width - 2*dpr, y - 2*dpr, 1);
					}
				}
		
			}
		},
		yAxisPercentageRender = () => {
			ctx.textAlign = 'left';
			ctx.strokeStyle = ctx.fillStyle = params.fntAxesColor;
			let levels  = 4,
				levelHeigth = (yArea - topOffset)/levels;// - params.fntAxesSize + 4*dpr;
			for (let i = levels + 1; i--;) {
				let y = yArea - levelHeigth * (i);
				text(i*25, 2*dpr, y - 2*dpr, 1);
			}
		},
		lineRender = (column, colIndex) => {
			ctx.beginPath();
			ctx.lineWidth = params.chrLnWidth;
			ctx.lineJoin = 'round';
			ctx.strokeStyle = column.color;
			ctx.globalAlpha = column.opacity;
			chart.forEachX((value, index) => {
				let x = (value - x_range.begin)*x_range.XScale, 
					y = chart.getYValue(colIndex, index) - y_range.min;
				if (index == x_range.iBegin)
					ctx.moveTo(x, yArea - y * y_range.YScale);
				else
					ctx.lineTo(x, yArea - y * y_range.YScale);
			}, x_range.iBegin, x_range.iEnd);
			ctx.stroke();
			ctx.globalAlpha = 1;
		},
		renderLineSelected =  (column, colIndex) => {
			ctx.beginPath();
			ctx.lineWidth = params.chrLnWidth;
			ctx.lineJoin = 'round';
			ctx.strokeStyle = column.color;
			ctx.fillStyle = params.bkgColor;
			ctx.globalAlpha = column.opacity;
			let x = (chart.getX(selectedX.index) - x_range.begin)*x_range.XScale, 
				y = chart.getYValue(colIndex, selectedX.index) - y_range.min;
			ctx.arc(x, yArea - y * y_range.YScale, 4*dpr, 0, 2*Math.PI);
			ctx.fill();
			ctx.stroke();
		},
		barRender = (column, colIndex) => {
			const barWidth = width/(x_range.iEnd - x_range.iBegin) / 2;
			ctx.beginPath();
			ctx.fillStyle = column.color;
			ctx.moveTo(width, yArea);
			ctx.lineTo(0, yArea);
			chart.forEachX((value, index) => {
				let x = (value - x_range.begin)*x_range.XScale, 
					y = chart.getYValue(colIndex, index) - (!chart.data.stacked ? y_range.min : 0); 
				ctx.lineTo(x - barWidth, yArea - y * y_range.YScale);
				ctx.lineTo(x + barWidth, yArea - y * y_range.YScale);

			}, x_range.iBegin, x_range.iEnd);
			ctx.closePath();
			ctx.fill();
		},
		barSelectedRender = (column, colIndex) => {
			ctx.globalAlpha  = 1;
			const barWidth = width/(x_range.iEnd - x_range.iBegin) / 2;
			let x = (chart.getX(selectedX.index) - x_range.begin)*x_range.XScale, 
				y = chart.getYValue(colIndex, selectedX.index) - (!chart.data.stacked ? y_range.min : 0);
			ctx.beginPath();
			ctx.fillStyle = column.color;
			ctx.moveTo(x - barWidth, yArea);
			ctx.lineTo(x + barWidth, yArea);
			ctx.lineTo(x + barWidth, yArea - y * y_range.YScale);
			ctx.lineTo(x - barWidth, yArea - y * y_range.YScale);
			ctx.closePath();
			ctx.fill();			
		},
		areaRender = (column, colIndex) => {
			ctx.beginPath();
			ctx.fillStyle = column.color;
			ctx.moveTo(width, yArea); //right-bottom corner
			ctx.lineTo(0, yArea);	// left-bottom corner
			
			if(chart.data.percentage && order == 0) {
				ctx.lineTo(0, topOffset); // left-top corner 
				ctx.lineTo(width, topOffset);	// right-top corner
				ctx.closePath();
				ctx.fill();	
				return;
			}
			chart.forEachX((value, xIndex) => {	
				let x = (value - x_range.begin)*x_range.XScale, 
					y = yArea - (chart.data.percentage ? yArea - topOffset : yArea) * chart.getYValue(colIndex, xIndex);
				ctx.lineTo(x, y);	
			}, x_range.iBegin, x_range.iEnd);
			ctx.closePath();
			ctx.fill();	
		},
		pieRender = (column, index) => {
			let value = pie.values[index] / pie.sum,
				angle = value * Math.PI*2,
				textAngle = pie.renderAngle - angle/2, 
				textRadius = pie.radius*.7, 
				fontSize = (params.fntAxesSize + 20*value);

			if(anim.pieRange) {
				let prevValue = pie.prevValues[index] / pie.prevSum;
				value = prevValue + (value - prevValue)*anim.pieRange.progress;
				angle = value * Math.PI*2;
			}

			let cX = centerX, cY = centerY;

			if(index == selectedX.index) {
				cX += pie.selectedOut*Math.cos(textAngle); 
				cY += pie.selectedOut*Math.sin(textAngle); 
			}

			ctx.beginPath();
			ctx.fillStyle = column.color;
			ctx.moveTo(cX, cY);
			ctx.lineTo(cX + pie.radius*Math.cos(pie.renderAngle), cY + pie.radius*Math.sin(pie.renderAngle));
			ctx.arc(cX, cY, pie.radius, pie.renderAngle, pie.renderAngle-angle, true);			
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = '#FFFFFF';
			
			ctx.textAlign =  textAngle > Math.PI/2 || value < Math.PI*2/3 ? 'center' : 'left';

			if(value > .02) {
				ctx.font = 'bold ' + fontSize + 'px ' + params.fntAxes;
				text(Math.round(value*100).toFixed(0) + '%', cX + textRadius*Math.cos(textAngle), cY + textRadius*Math.sin(textAngle) + fontSize/2 );
				ctx.font = params.fntAxesSize + 'px ' + params.fntAxes;
			}
			pie.renderAngle  -= angle;
		},
		zoomInRender = () => {
			ctx.globalAlpha = 1 - anim.zoomIn.progress;
		},
		zoomInPieRender = () => {
			ctx.fillStyle = params.bkgColor;
			ctx.fillRect(0, yArea, width, height - yArea); 

			ctx.beginPath();
			ctx.fillStyle = '#FFFFFF';
			ctx.globalCompositeOperation = 'destination-in';
			ctx.arc(width/2, height/2, pie.radius, 0, 2 * Math.PI);
			ctx.fill();	
			ctx.globalCompositeOperation = 'source-over';
		},
		zoomInPieChartRender = (column, colIndex) => {
			const pieAngle = 2 * Math.PI*chart.getYValue(colIndex, pie.index),
				setProgress = (value, to = 0) => (to - value)*pie.zoomProgress;

			ctx.translate(centerX, centerY);
			ctx.rotate((Math.PI / 18)*pie.zoomProgress);
			ctx.translate(-centerX, -centerY);

			ctx.beginPath();
			ctx.fillStyle = ctx.strokeStyle = column.color;

			ctx.moveTo(width, yArea); //right-bottom corner
			ctx.lineTo(0, yArea);	// left-bottom corner


			if(order==0) {
				ctx.moveTo(width, yArea); //right-bottom corner
				ctx.lineTo(0, yArea);	// left-bottom corner
				ctx.lineTo(0, topOffset); // left-top corner 
				ctx.lineTo(width, topOffset);	// right-top corner
				ctx.closePath();
				ctx.fill();	
				return;
			}

			ctx.moveTo(centerX + pie.radius, centerY);
			ctx.arc(width/2, height/2, pie.radius, 0, Math.PI + setProgress(Math.PI, pieAngle));

			let afterMiddle = false;

			chart.forEachX((value, xIndex) => {	
				let x = (value - x_range.begin)*x_range.XScale, 
					y = yArea - (yArea - topOffset) * chart.getYValue(colIndex, xIndex);
				

				if(x >= centerX && !afterMiddle) {
					x += setProgress(x, centerX);
					afterMiddle = true;
				}

				if(!afterMiddle) {
					let radius = Math.abs(x - centerX),
						ang = Math.PI;
					y += setProgress(y, centerY);
					ang += setProgress(ang, pieAngle);
					x = Math.cos(ang)*radius + centerX;
					y +=Math.sin(ang)*radius;
				} else {
					
					let deltaY = setProgress(y, centerY);
					let cy = y + (deltaY + deltaY*(Math.pow((x - centerX)/centerX, 1/2)));
					if((centerY < cy && centerY < y)||(centerY > cy && centerY > y))
						y = cy;
					else
						y = centerY;
				}
				ctx.lineTo(x, y);	
			}, x_range.iBegin, x_range.iEnd);
			
			ctx.closePath();
			ctx.fill();	

			ctx.resetTransform();
		},
		updateXRange = () => {
			x_range.XScale = width / (x_range.end - x_range.begin);
			x_range.iBegin = chart.getFloorX(x_range.begin);
			x_range.iEnd = chart.getFloorX(x_range.end) + 1;

			if(skipFactorChaged) {
				x_range.textWidth = x_range.textWidth || ctx.measureText(chart.getXLabel(0)).width;
				let factor = 2 << ~~(Math.log2((x_range.iEnd - x_range.iBegin) / ~~(width / x_range.textWidth)));
				if (x_range.skipFactor != factor) {
					if (factor > x_range.skipFactor) {
						anim.add('CR_xrange_skipAlpha_fadeOut', 200).for(x_range, 'skipAlpha').from(1).to(0).tick(()=> {flag = true;}).run();
					}
					if (factor < x_range.skipFactor) {
						anim.add('CR_xrange_skipAlpha_fadeIn', 200).for(x_range, 'skipAlpha').from(0).to(1).tick(()=> {flag = true;}).run();
					}
					x_range.skipFactor = factor;
				}
			}
			skipFactorChaged = rangeXChanged = false;
		},
		updateYRange = () => {
			const minMax = chart.getMinMaxValue(x_range.iBegin, x_range.iEnd),
				from = {min: y_range.min, max: y_range.max};

			if(from.min == minMax.min && from.max == minMax.max) {
				rangeYChanged = false; 
				return;
			}
			if(anim.CR_yRange) {
				anim.CR_yRange.to = {min: gradation(minMax.min, true),max: gradation(minMax.max)};
				rangeYChanged = false; 
				return;
			}
			anim.add('CR_yRange', 150)
				.from(from)
				.to({min: gradation(minMax.min,  true), max: gradation(minMax.max)})
				.tick((value, from, to)=>{
					y_range.max = (to.max - from.max)*value + from.max;
					y_range.min = (to.min - from.min)*value + from.min;
					y_range.YScale = yArea/(y_range.max - y_range.min);
					flag = true;
				}).after(()=>{
					/*y_range.max = minMax.max;
					y_range.min = minMax.min;
					y_range.YScale = yArea/(y_range.max - y_range.min);*/
					flag = true;
				})
				.run();
			rangeYChanged = false;
		},
		updatePieRange = () => {
			pie.iBegin = chart.getCloserX(pie.begin);
			pie.iEnd = chart.getCloserX(pie.end);
			pie.prevValues = pie.values.slice();
			pie.prevSum = pie.sum;
			delete pie.values;			
			pie.values = [];
			pie.sum = 0;
			chart.forEachColumn((column, colIndex) => {
				chart.forEachX((value, xIndex) => {
					if(pie.values[colIndex])
						pie.values[colIndex] += column.values[xIndex]*column.opacity;
					else
						pie.values[colIndex] = column.values[xIndex]*column.opacity;
					pie.sum += column.values[xIndex]*column.opacity;
				}, pie.iBegin, pie.iEnd);
			});
		},
		topOffset = params.fntAxesSize + 4*dpr,
		x_range = {begin: 0, end: 0, XScale: 0, iBegin: 0, iEnd: 0, skipFactor: 0, textWidth: 0, skipAlpha: 0},
		y_range = {max: 6, min: 0, YScale: 0},
		selectedX = {selected: false, xValue: 0, index: 0, zoomed: false, piemode: false},
		pie = {active: false, zoomProgress: 0, radius: 0, dayOfWeek: 0, begin: 0, end:0, iBegin: 0, iEnd: 0, prevValues: [], prevSum:[], values: [], sum: 0 , renderAngle: 0, selected: -1, selectedOut: 0};

	let flag = true, rangeXChanged = true, rangeYChanged = true, skipFactorChaged = true, rangePieChanged = false, order = 0;

	ctx.imageSmoothingEnabled = true;
	ctx.font = params.fntAxesSize + 'px ' + params.fntAxes;
	//ctx.scale(1/dpr,-1/dpr);


	this.updateYRangeWA = () => {
		const {min: min, max: max} = chart.getMinMaxValue(x_range.iBegin, x_range.iEnd);
		y_range.max = max;
		y_range.min = min;
		y_range.YScale = yArea/(y_range.max - y_range.min);
		rangeXChanged = true;
		rangeYChanged = false;	
		flag = true;		
	};
	this.setRange = (begin, end) => {
		if(begin > end) return;
		if(pie.active) {
			pie.begin = begin;
			pie.end = end;

			rangePieChanged = flag = true;
			return;
		}

		x_range.begin = begin;
		x_range.end = end;
		skipFactorChaged = rangeYChanged =  true;
		rangeXChanged = flag = true; 
		anim.add('bag',100).tick(()=>{rangeYChanged = flag = true;}).run();
	};
	this.setBeginRange = (begin) => {
		if(pie.active) {
			pie.begin = begin;
			rangePieChanged = flag = true;
			return;
		}
		x_range.begin = begin;
		skipFactorChaged = rangeYChanged = rangeXChanged = flag = true; 
	};
	this.setEndRange = (end) => {
		if(pie.active) {
			pie.end = end;
			rangePieChanged = flag = true;
			return;
		}
		x_range.end = end;
		skipFactorChaged = rangeYChanged = rangeXChanged = flag = true; 
	};
	this.getBeginRange = () => x_range.begin;
	this.getEndRange = () => x_range.end;

	this.setSelectedX = (screenPosX, screenPosY) => {
		if(pie.active) {
			let radius = Math.hypot(screenPosX - centerX, screenPosY - centerY);
			if(radius > pie.radius) { 
				this.unsetSelectedX();
				flag = true;
				return false;
			}
			let percent = Math.acos((screenPosX - centerX )/ radius)/Math.PI/2;
			if(screenPosY < centerY) percent = 1 - percent; 
			
			
			selectedX.selected = false;
			let sum = 1;
			chart.forEachColumn((column, index) => {
				sum -=  pie.values[index] / pie.sum;
				if(percent > sum && !selectedX.selected) {
					selectedX.index = index;
					selectedX.selected = true;
				}
			});

			anim.add('pieSelect', 100)
				.for(pie, 'selectedOut')
				.from(0).to(30)
				.tick(()=>{flag=true;})
				.run();

			selectedX.xValue = pie.values[selectedX.index];
			selectedX.piemode = true;
			flag = true;
			return true;
		}

		selectedX.selected = true;
		selectedX.index = chart.getCloserX(screenPosX/x_range.XScale + x_range.begin);
		selectedX.xValue = chart.getX(selectedX.index);
		flag = true; 
		return true;
	};
	this.getSelectedX = () => selectedX;
	this.unsetSelectedX = () => { selectedX.selected = false; selectedX.index = -1; selectedX.piemode = false; };

	this.zoomInPie = () => {
		if(!selectedX.selected) return;
		selectedX.zoomed = true;
		pie.active = true;
		
		pie.index = selectedX.index;
		pie.xValue = selectedX.xValue;
		this.setRange(selectedX.xValue, selectedX.xValue);

		anim.add('zoomInPie_radius', 1200)
			.timing('elastic','out')
			.for(pie, 'radius')
			.from(width+height)
			.to(Math.min(width, height)*.3)
			.tick(()=>{flag = true;})
			.run();

		anim.add('zoomInPie', 400)
			.for(pie, 'zoomProgress')
			.from(0).to(1)
			.timing('circ','out')
			.tick(() => {
				flag = true;
			})
			.after(()=>{
				rangePieChanged = flag = false;
			})
			.run();
		return pie;
	};

	this.zoomOutPie = () => {
		if(!selectedX.selected) return;
		selectedX.zoomed = selectedX.piemode = pie.active = false;
		anim.add('zoomInPie_radius', 1200)
			//.timing('elastic','out')
			.for(pie, 'radius')
			.from(width*.3)
			.to(width+height)
			.tick(()=>{flag = true;})
			.run();

		anim.add('zoomInPie', 400)
			.for(pie, 'zoomProgress')
			.from(1).to(0)
			.tick(() => {
				flag = true;
			})
			.after(()=>{
				rangeXChanged = true;
				//updateXRange();
				flag = true;
			})
			.run();


	};

	this.zoomIn = (cb) => {
		if(!selectedX.selected) return;
		selectedX.zoomed = true;
		anim.add('zoomIn', 200)
			.from({begin: x_range.begin, end: x_range.end})
			.tick((progress, from) => {
				x_range.begin = from.begin + (selectedX.xValue - from.begin)*progress;
				x_range.end = from.end + (selectedX.xValue - from.end)*progress;
				rangeXChanged = true;
				flag = true;
			})
			.after(()=>{
				cb();
				flag = true;
			})
			.run();
	};

	this.zoomOut = () => {
		selectedX.zoomed = false;
	};

	this.showColumn = (index) => {
		rangeYChanged = true;
		anim.add('columnOpacity', 200)
			.for(chart.data.columns[index], 'opacity')
			.from(0).to(1)
			.timing('circ', 'out')
			.tick(()=>{
				rangePieChanged = flag = true;
			})
			.after(() => {
				rangePieChanged = flag = true;
			})
			.run();
	};

	this.hideColumn = (index) => {
		rangeYChanged = true;
		anim.add('columnOpacity', 200)
			.for(chart.data.columns[index], 'opacity')
			.from(1).to(0)
			.tick(()=>{
				rangePieChanged = flag = true;
			})
			.after(() => {
				rangePieChanged = flag = true;
			})
			.run();
	};

	this.prepare = () => {
		ctx.clearRect(0, 0, width, height);
		if(rangeXChanged) updateXRange();
		if(rangeYChanged) updateYRange();
		if(pie.active&&rangePieChanged) updatePieRange();
		order = 0;
		pie.renderAngle = 0;
	};

	this.render = () => {
		if(selectedX.selected && chart.data.columns.length>0 && chart.data.columns[0].type == 'bar') {
			ctx.globalAlpha = 0.5;
			//ctx.globalCompositeOperation = 'lighten';
			ctx.fillStyle = params.ltnColor;
			ctx.fillRect(0 ,0 ,width, height);
			ctx.globalAlpha = 1;
			//ctx.globalCompositeOperation = 'source-over';
		}

		if(anim.zoomInPie) {
			zoomInPieRender();
		}

		if(pie.active) {
			gridRender();
			if(params.debug) debugRender();
			return;
		}
		gridRender();
		
		if(anim.zoomIn) {
			zoomInRender();
		}

		xAxisRender();

		if(chart.data.percentage)
			yAxisPercentageRender();
		else
			yAxisRender();

		if(params.debug) debugRender();
	};

	this.renderChart = (column, index, columns, call = (column, index)=>{
		if(anim.zoomInPie) {
			zoomInPieChartRender(column, index);
			return;
		}
		if(pie.active) {
			pieRender(column, index);
			return;
		}
		if(column.type === 'line') {
			lineRender(column, index);
			return;
		}
		if(column.type === 'bar') {
			barRender(column, index);
			return;
		}
		if(column.type === 'area') {
			areaRender(column, index);
			return;
		}
	}) => {
		if(!column || column.opacity === 0) return;
		call(column, index, columns);
		order++;
	};

	this.renderChartSelected = (column, index) => {
		if(!column || column.opacity === 0) return;
		if(column.type === 'line') {
			renderLineSelected(column, index);
			return;
		}
		if(column.type === 'bar') {
			barSelectedRender(column, index);
			return;
		}
	};

	this.finally = () => flag = false;
	this.flag = () => flag;
	
	this.refresh = () => flag = true;
	this.resize = () => {
		const rect = {width: canvas.parentElement.clientWidth, height: canvas.parentElement.clientHeight};
		canvas.setAttribute('width',rect.width);			
		canvas.setAttribute('height',rect.height);
		width = rect.width;
		height = rect.height;
		centerX = width/2;
		centerY = height/2;
		yArea = height - params.fntAxesSize - 10*dpr;
		rangeXChanged = rangeYChanged = flag = true;
	};

	this.direct = () => true;//pie.active || !chart.data.stacked;
};
/* chartView.js */
//DONE: 1 zoomIn/Out animation ?
//DONE: 2. Range navigator 
//DONE: 3 Pie chart: animation, selection, moving ...
//DONE: 4. Pie chart - navigator (week) - step to day
//TODO: Night style
// TODO: CSS anim
// DONE: mouse events
// TODO: ranges zooming


// TODO Bugs: 
// - HIde x-values on sides of screen
// - yMin of chartRender
// - zooming anim ??????

'use strict';
const ChartView = function (c, title, params, dataLoader) {
	/* PRIVATE METHODS */
	const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		addDomElem = (parent, tag, classes = '', html = '') => {
			const e = document.createElement(tag);
			parent.appendChild(e);
			e.classList.add(classes);
			e.innerHTML = html;
			return e;
		},
		getCloserStep = (value, stepLength) => {
			const floor = ~~(value / stepLength)*stepLength, before = value - floor;
			return (floor + stepLength - value > before ) ? -before :  floor + stepLength - value;
		},
		eventsInit = () => {
			const supportsPassive = (() => {
					let sp = false;
					try {
						const opts = Object.defineProperty({}, 'passive', {
							// eslint-disable-next-line getter-return
							get: function() {
								sp = true;
							}
						});
						window.addEventListener('testPassive', null, opts);
						window.removeEventListener('testPassive', null, opts);
						// eslint-disable-next-line no-empty
					} catch (e) {
					}
					return sp;
				})(),
				onNavMove = (e) => {
					if(!this.mouseFlags.onNavMove) return;
					const lim = this.$prv_container.offsetWidth - this.$nav.clientWidth - 2,
						left = ~~(this.$nav.offsetLeft + e.pageX - this.mouseFlags.prevX);
					this.$nav.style.left =  (left<=0 ? 0 : left >= lim ? lim : left) + 'px';
					_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
					this.mouseFlags.prevX  = e.pageX;
				},
				onMouseUp = () => {				
					if(_previewRender.piemode) {
						if(!this.mouseFlags.onNavMove) return;
						if(this.$nav.offsetLeft % this.$prv_container.offsetWidth/7 > 0) 
						{
							_anim.add('pieModeNav', 100)
								.from(this.$nav.offsetLeft)
								.to(this.$nav.offsetLeft + getCloserStep(this.$nav.offsetLeft, this.$prv_container.offsetWidth/7))
								.tick((value) => {
									this.$nav.style.left =  value + 'px';
								}).run();
						}
					}
					rangeInfoOut(_chartRender.getBeginRange(), _chartRender.getEndRange());
					this.mouseFlags.onNavMove = false;
				};

			this.$nav.addEventListener('mousedown', (e)=>{
				this.mouseFlags.prevX  = ~~e.pageX;		
				if(e.pageX < (this.$nav.offsetLeft + this.$navl.offsetWidth)
				|| e.pageX > (this.$nav.offsetLeft + this.$nav.offsetWidth - this.$navr.offsetWidth)) return;

				_chartRender.unsetSelectedX();
				hidePlaque();
				this.mouseFlags.onNavMove = true;
			});
			
			this.$nav.addEventListener('mousemove', onNavMove);
			this.$nav.addEventListener('mouseup', onMouseUp);


			this.$nav.addEventListener('touchstart', (e)=>{
				this.mouseFlags.prevX  = ~~e.touches[0].pageX;		
				if(e.touches[0].pageX < (this.$nav.offsetLeft + this.$navl.offsetWidth)
				|| e.touches[0].pageX > (this.$nav.offsetLeft + this.$nav.offsetWidth - this.$navr.offsetWidth)) return;

				_chartRender.unsetSelectedX();
				hidePlaque();
				this.mouseFlags.onNavMove = true;
			}, supportsPassive ? { passive: true } : false );

			this.$nav.addEventListener('touchmove', (e)=>{ 
				onNavMove(e.touches[0]);
				e.stopPropagation();
			}, supportsPassive ? { passive: true } : false );
			
			this.$nav.addEventListener('touchend', onMouseUp);

			const onMouseDownNavL = (e) => {
					this.mouseFlags.onBeginMove = true;
					this.mouseFlags.prevX  = ~~e.pageX;		
					_chartRender.unsetSelectedX();
					hidePlaque();
				}, 
				onMouseMoveNavL = (e) => {
					if(!this.mouseFlags.onBeginMove) return;
					const lim = this.$nav.offsetLeft + this.$nav.clientWidth - this.$navl.clientWidth * 2,
						d = ~~(e.pageX - this.mouseFlags.prevX), 
						left = this.$nav.offsetLeft + d;
					if(!d || left >= lim ) return;
					this.$nav.style.left =  (left<=0 ? 0 : left >= lim ? left : left) + 'px';
					this.$nav.style.width = (this.$nav.clientWidth - d) + 'px';
					_chartRender.setBeginRange(screenPosToXValue(this.$nav.offsetLeft));
					this.mouseFlags.prevX  = e.pageX;
				},
				onMouseUpNavL = () => {
					this.mouseFlags.onBeginMove = false;
					if(_previewRender.piemode) {
						if(this.$nav.offsetLeft % this.$prv_container.offsetWidth/7 > 0) 
						{
							_anim.add('pieModeNavLeft', 100)
								.from(this.$nav.offsetLeft)
								.to(this.$nav.offsetLeft + getCloserStep(this.$nav.offsetLeft, this.$prv_container.offsetWidth/7))
								.tick((value) => {
									this.$nav.style.left =  value + 'px';
								}).run();
							_anim.add('pieModeNavWidth', 100)
								.from(this.$nav.offsetWidth)
								.to(this.$nav.offsetWidth + getCloserStep(this.$nav.offsetWidth, this.$prv_container.offsetWidth/7))
								.tick((value) => {
									this.$nav.style.width =  value + 'px';
								}).run();
						}
					}
					rangeInfoOut(_chartRender.getBeginRange(), _chartRender.getEndRange());
					this.mouseFlags.onNavMove = false;

				},
				onMouseDownNavR = (e) => {
					this.mouseFlags.onEndMove = true;
					this.mouseFlags.prevX  = ~~e.pageX;		
					_chartRender.unsetSelectedX();
					hidePlaque();
				}, 
				onMouseMoveNavR = (e) => {
					if(!this.mouseFlags.onEndMove) return;
					const d = ~~(e.pageX - this.mouseFlags.prevX);
					if(!d) return;
					this.$nav.style.width = this.$nav.clientWidth + d + 'px';
					_chartRender.setEndRange(screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
					this.mouseFlags.prevX  = e.pageX;
				},
				onMouseUpNavR = () => {
					this.mouseFlags.onEndMove = false;
					if(_previewRender.piemode) {
						if(this.$nav.offsetLeft % this.$prv_container.offsetWidth/7 > 0) 
						{
							_anim.add('pieModeNavWidth', 100)
								.from(this.$nav.offsetWidth)
								.to(this.$nav.offsetWidth + getCloserStep(this.$nav.offsetWidth, this.$prv_container.offsetWidth/7))
								.tick((value) => {
									this.$nav.style.width =  value + 'px';
								}).run();
						}
					}
					this.mouseFlags.onNavMove = false;
					rangeInfoOut(_chartRender.getBeginRange(), _chartRender.getEndRange());
				};
			

			this.$navl.addEventListener('touchstart', (e)=>{onMouseDownNavL(e.touches[0]);}, supportsPassive ? { passive: true } : false );
			this.$navl.addEventListener('mousedown', onMouseDownNavL, supportsPassive ? { passive: true } : false );

			this.$navl.addEventListener('touchmove', (e)=>{
				onMouseMoveNavL(e.touches[0]);
				e.stopPropagation();
			}, supportsPassive ? { passive: true } : false );
			this.$navl.addEventListener('mousemove',onMouseMoveNavL);

			this.$navl.addEventListener('touchend',onMouseUpNavL);
			this.$navl.addEventListener('mouseup',onMouseUpNavL);


			this.$navr.addEventListener('touchstart', (e)=>{onMouseDownNavR(e.touches[0]);}, supportsPassive ? { passive: true } : false );
			this.$navr.addEventListener('mousedown', onMouseDownNavR, supportsPassive ? { passive: true } : false );

			this.$navr.addEventListener('touchmove', (e)=>{
				onMouseMoveNavR(e.touches[0]);
				e.stopPropagation();
			}, supportsPassive ? { passive: true } : false );
			this.$navr.addEventListener('mousemove',onMouseMoveNavR);

			this.$navr.addEventListener('touchend', onMouseUpNavR);
			this.$navr.addEventListener('mouseup',onMouseUpNavR);


			this.$cnv.addEventListener('click', (e) => {
				if(_chartRender.setSelectedX(e.offsetX*_dpr, e.offsetY*_dpr))
					showPlaque(_chartRender.getSelectedX());
				else
					hidePlaque();
			});

			this.$plq.$caption.addEventListener('click', () => {
				if(_chartRender.getSelectedX().zoomed) return;
				zoomIn();
			});

			this.$zmo.addEventListener('click', () => {
				zoomOut();
			});

			window.addEventListener('resize', () => {
				if(_previewRender)
					_previewRender.resize();
				if(_chartRender)
					_chartRender.resize();
			});

		},
		rangeInfoOut = (begin, end) => {
			let dateBegin = new Date(begin),
				dateEnd = new Date(end);
			this.$rng.innerHTML = dateBegin.getDate() + ' ' + MONTHS[dateBegin.getMonth()] + ' ' + dateBegin.getFullYear() 
				+ ' - ' + dateEnd.getDate() + ' ' + MONTHS[dateEnd.getMonth()] + ' ' + dateEnd.getFullYear();
		},
		showPlaque = (selectedX) => {
			if(!this.$plq) return;

			if(selectedX.piemode) {
				this.$plq.classList.add('show');
				this.$plq.$list.innerHTML = `<div><span>${_chart.data.columns[selectedX.index].name}</span><span style="color:${_chart.data.columns[selectedX.index].color}">${selectedX.xValue}</span>`;
				return;	
			}

			this.$plq.$caption.innerHTML = '';
			this.$plq.$list.innerHTML = '';
			this.$plq.classList.add('show');
			this.$plq.$caption.innerHTML = _params.valToStr(selectedX.xValue, false);
			if(_chart.data.percentage)  this.$plq.$list.classList.add('percentage');
			_chart.forEachColumn((column) => {
				let innerHTML = '';
				if(column.visible) {
					if(_chart.data.percentage) {
						innerHTML = `<span>${(column.values[selectedX.index]/_chart.getSumYValues(selectedX.index)*100).toFixed(0)}%</span>`;
					}
					innerHTML += `<span>${column.name}</span><span style="color:${column.color}">${column.values[selectedX.index]}</span>`;
					addDomElem(this.$plq.$list, 'div', `${column.name.toLowerCase().replace(' ', '_')}`, innerHTML);
				}
			});
		},
		hidePlaque = () => {
			if(!this.$plq) return;
			this.$plq.classList.remove('show');
			this.$plq.$list.classList.remove('percentage');
			this.$plq.$caption.innerHTML = '';
			this.$plq.$list.innerHTML = '';
		},
		zoomIn = () => {
			if(_dataLoader.zoomIn) {
				_chartRender.zoomIn(() => {
					_chart.pushCache();
					_chart.clearData();
					_dataLoader.getZoom(_chartRender.getSelectedX().xValue);
					_navigator.left = this.$nav.offsetLeft;
					_navigator.width = this.$nav.offsetWidth;
					_anim.add('zoomInNav', 400)
						.tick((progress) => {
							this.$nav.style.left = _navigator.left + (this.$prv_container.offsetWidth/7*3 - _navigator.left)*progress + 'px';
							this.$nav.style.width = _navigator.width + (this.$prv_container.offsetWidth/7 - _navigator.width)*progress + 'px';
							_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
						})
						.after(()=>{
							_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));		
						})
						.run();
				});
			} else if(_chart.data.percentage) {
				_chartRender.zoomInPie();
				_previewRender.piemode = true;
				_previewRender.setXAxis(_chartRender.getSelectedX().index-3, _chartRender.getSelectedX().index+4).setYAxis();
				_navigator.left = this.$nav.offsetLeft;
				_navigator.width = this.$nav.offsetWidth;
				_anim.add('zoomInNav', 400)
					.tick((progress) => {
						this.$nav.style.left = _navigator.left + (this.$prv_container.offsetWidth/7*3 - _navigator.left)*progress + 'px';
						this.$nav.style.width = _navigator.width + (this.$prv_container.offsetWidth/7 - _navigator.width)*progress + 'px';
					//_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
					})
					.after(()=>{
					//_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));		
					})
					.run();
			}
			hidePlaque();
			this.$cnt.classList.add('zoomed');
		},
		zoomOut = () => {
			if(dataLoader.zoomIn) {
				_chartRender.zoomOut();
				_chart.popCache();				
				_previewRender.setXAxis().setYAxis();
				_anim.add('zoomOutNav', 400)
					.from({left: this.$nav.offsetLeft, width: this.$nav.offsetWidth})
					.tick((progress, from) => {
						this.$nav.style.left = from.left + (_navigator.left - from.left)*progress + 'px';
						this.$nav.style.width = from.width + (_navigator.width - from.width)*progress + 'px';
						_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
					})
					.after(()=>{
						_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));		
					})
					.run();				
				legendInit();
				_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
			} else if(_chart.data.percentage) {
				_previewRender.piemode = false;
				_chartRender.zoomOutPie();
				_previewRender.setXAxis().setYAxis();
				_anim.add('zoomOutNav', 400)
					.from({left: this.$nav.offsetLeft, width: this.$nav.offsetWidth})
					.tick((progress, from) => {
						this.$nav.style.left = from.left + (_navigator.left - from.left)*progress + 'px';
						this.$nav.style.width = from.width + (_navigator.width - from.width)*progress + 'px';
					//_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
					})
					.after(()=>{
						_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));		
					})
					.run();
			}
			hidePlaque();
			this.$cnt.classList.remove('zoomed');			
		},
		screenPosToXValue = pos => pos * _dpr / _previewRender.XScale + _chart.getX(_previewRender.iBegin),
		previewRenderInit = () => {
			// eslint-disable-next-line no-undef
			_previewRender = new PreviewRender(this.$prv, _chart, _dpr, _anim, _params);
			_previewRender.resize();
			_previewRender.setXAxis().setYAxis();
		},
		chartRenderInit = () => {
			// eslint-disable-next-line no-undef
			_chartRender = new ChartRender(this.$cnv, _chart, _dpr, _anim, _params);
			_chartRender.resize();
			_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
		},
		legendInit = () => {
			if(_chart.data.columns.length < 2) {
				this.$lgd.innerHTML = '';	
				return;
			}
			let innerHTML = '';
			_chart.forEachColumn((column, index)=>{
				innerHTML = `<div data-column="${index}" style="background-color:${column.color};color:${column.color}"><span>${column.name}</span></div>` + innerHTML;
			});
			this.$lgd.innerHTML = innerHTML;

			this.$lgd.childNodes.forEach((elem) => {
				elem.addEventListener('click', (e) => {
					e.path[0].classList.toggle('unchecked');
					toggleColumnVisible(e.path[0].attributes['data-column'].value);
				});
			});
		},
		toggleColumnVisible = (index) => {
			hidePlaque();
			_chart.data.columns[index].visible = !_chart.data.columns[index].visible;
			if(_chart.data.columns[index].visible) {
				_chartRender.showColumn(index);
				_previewRender.refreshBy(200);
			} else {
				_chartRender.hideColumn(index);
				_previewRender.refreshBy(200);
			}
		},
		render = () => {
			if(_previewRender&&_previewRender.flag()) _previewRender.prepare(); 
			if(_chartRender&&_chartRender.flag()) _chartRender.prepare(); 
			_chart.forEachColumn((column, index, columns)=> {
				if(_previewRender&&_previewRender.flag())
					_previewRender.render(column, index, columns);
				if(_chartRender&&_chartRender.flag())
					_chartRender.renderChart(column, index, columns);
			}, _chartRender.direct());


			if(_chartRender&&_chartRender.flag())
				_chartRender.render();


			if(_chartRender.getSelectedX().selected)
				_chart.forEachColumn((column, index, columns)=> {
					if(_chartRender&&_chartRender.flag())
						_chartRender.renderChartSelected(column, index, columns);
				}, _chartRender.direct());

			if(_previewRender&&_previewRender.flag()) _previewRender.finally();
			if(_chartRender&&_chartRender.flag()) _chartRender.finally();
		},
		loop = () => {
			_animFrame.call(window, loop);
			_anim.update(Date.now());
			render();
		};
	/* PUBLIC FIELDS */
	this.$cnt = document.getElementById(c);
	this.$ttl = addDomElem(this.$cnt, params.titleTag || 'div', 'title');
	this.$zmo = addDomElem(this.$cnt, 'div', 'zoom-out', 'Zoom Out');
	this.$rng = addDomElem(this.$cnt, 'div', 'range');
	this.$plq = addDomElem(this.$cnt, 'div', 'plaque');
	this.$plq.$caption = addDomElem(this.$plq,'div', 'caption');
	this.$plq.$list = addDomElem(this.$plq,'div', 'list');	
	hidePlaque();
	this.$cnv_container = addDomElem(this.$cnt, 'div', 'canvas-container');
	this.$cnv = addDomElem(this.$cnv_container, 'canvas', 'chart');
	this.$prv_container = addDomElem(this.$cnt, 'div', 'preview-container');
	this.$prv = addDomElem(this.$prv_container, 'canvas', 'preview');
	this.$nav = addDomElem(this.$prv_container, 'div', 'nav');
	this.$navl = addDomElem(this.$nav, 'div', 'nav-left');
	this.$navr = addDomElem(this.$nav, 'div', 'nav-right');
	this.$nav.style.width = '100px';
	this.$lgd = addDomElem(this.$cnt, 'div', 'legend');
	this.$ttl.innerHTML = this.title = title || 'Chart';
	this.mouseFlags = {
		onNavMove: false,
		onBeginMove: false,
		onEndMove: false,
		prevX: -1,
		prevY: -1
	};
	/* PRIVATE FIELDS */
	const _dpr = params.devicePixelRatio || window.devicePixelRatio || 1,
		_params = {
			prvLnWidth: params.previewLineWidth*_dpr || 2*_dpr,
			chrLnWidth: params.chartLineWidth*_dpr || 2*_dpr,
			fntAxes: params.fontAxes || window.getComputedStyle(this.$cnv).getPropertyValue('font-family'),
			fntAxesSize: params.fontAxesSize*_dpr || 10*_dpr,
			fntAxesColor: params.fontAxesColor || window.getComputedStyle(this.$cnv).getPropertyValue('color'),
			lineAxesColor: params.lineAxesColor || window.getComputedStyle(this.$cnv).getPropertyValue('border-color'),
			bkgColor: params.backgroundColor || window.getComputedStyle(this.$cnv).getPropertyValue('background-color'),
			ltnColor: params.lightingColor || window.getComputedStyle(this.$cnv).getPropertyValue('lighting-color'),
			valToStr: params.valueToString || Number.prototype.toString.apply,
			timeToStr: params.timeToString || function(v){return (new Date(v)).toJSON().slice(11,16);},
			debug: params.debug || false
		},
		// eslint-disable-next-line no-undef
		_chart = new ChartData(),
		_dataLoader = dataLoader,
		_navigator = {},
		// eslint-disable-next-line no-undef
		_anim = new Anim(),
		_animFrame = params.requestAnimFrame || window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (t) {
				window.setTimeout(t, 1e3 / 60);
			};
	let _previewRender, _chartRender;
	

	this.updateColors = (colors = {}) => {
		_params.fntAxesColor = colors.fontAxesColor || window.getComputedStyle(this.$cnv).getPropertyValue('color');
		_params.lineAxesColor = colors.lineAxesColor || window.getComputedStyle(this.$cnv).getPropertyValue('border-color');
		_params.bkgColor = colors.backgroundColor || window.getComputedStyle(this.$cnv).getPropertyValue('background-color');
		_params.ltnColor = colors.lightingColor || window.getComputedStyle(this.$cnv).getPropertyValue('lighting-color');
		_chartRender.refresh();
	};

	previewRenderInit();
	chartRenderInit();

	if(_dataLoader) {
		_dataLoader.setOnloadEvent((data, zoom) => {
			_chart.setData(data, zoom ? _params.timeToStr : _params.valToStr);
			_previewRender.setXAxis().setYAxis();
			_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
			//_chartRender.updateYRangeWA();
			legendInit();
			rangeInfoOut(_chartRender.getBeginRange(), _chartRender.getEndRange());
			if(!zoom) {
				_anim.add('pieModeNavLeft', 100)
					.from(this.$nav.offsetLeft)
					.to(this.$nav.offsetLeft + 100)
					.tick((value) => {
						this.$nav.style.left =  value + 'px';
						_chartRender.setRange(screenPosToXValue(this.$nav.offsetLeft), screenPosToXValue(this.$nav.offsetLeft + this.$nav.offsetWidth));
					}).run();
			}
		});
	}

	eventsInit();
	loop();
};

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
