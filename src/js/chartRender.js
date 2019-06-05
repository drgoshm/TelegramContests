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