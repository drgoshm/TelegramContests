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
