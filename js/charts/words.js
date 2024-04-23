export class Words {
	constructor(_config) {
		this.config = {
			parentElementSelector: _config.parentElementSelector,
			parentElement: document.querySelector(_config.parentElementSelector),
			margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
			id: _config.id,
			groupingKey: _config.groupingKey || 'scene',
		};

		this.width = 0;
		this.height = 0;
		this.xAxisTitle = 'Seasons';
		this.yAxisTitle = '# of Lines';
		this.characterLines = [];
		this.activeSeasons = [];

		this.initVis();

		window.addEventListener('resize', () => {
			this.setWidthAndHeight();
			this.updateVis();
		});
	}

	initVis() {
		const idInParent = document.querySelector(this.config.id);
		if (!idInParent) {
			this.mainDiv = d3
				.select(this.config.parentElementSelector)
				.append('div')
				.style('height', '100%')
				.style('width', '100%')
				.attr('id', this.config.id);
		} else {
			this.mainDiv = d3.select(
				`${this.config.parentElementSelector} #${this.config.id}`
			);
		}

		this.setWidthAndHeight();

		this.svg = this.mainDiv
			.append('svg')
			.attr('width', '100%')
			.attr('height', '100%');

		this.xtitle = this.svg
			.append('text')
			.attr('x', 200)
			.attr('y', 180)
			.text(this.xAxisTitle);

		this.ytitle = this.svg
			.append('text')
			.attr('x', -110)
			.attr('y', 12)
			.text(this.yAxisTitle)
			.style('transform', 'rotate(270deg)');

		this.x = d3
			.scaleLinear()
			.domain([1, 10])
			.range([
				this.config.margin.left,
				this.width - this.config.margin.left,
			]);

		this.xAxis = d3.axisBottom().scale(this.x);

		this.xAxisG = this.svg
			.append('g')
			.attr(
				'transform',
				'translate(' + this.config.margin.left + ',' + this.height + ')'
			);

		/*this.xAxisG = this.svg.append("g")
           .attr("transform", "translate(0," + this.height + ")")
           .call(d3.axisBottom(this.x).ticks(5));*/

		this.y = d3.scaleLinear().domain([0, 10000]).range([this.height, 0]);

		this.yAxis = d3.axisLeft().scale(this.y);

		this.yAxisG = this.svg.append('g');

		/*this.yAxisG = this.svg.append("g")
           .call(d3.axisLeft(this.y));*/

		this.colorScale = d3
			.scaleOrdinal(d3.schemeTableau10)
			.domain(['Rachel', 'Ross', 'Chandler', 'Monica', 'Joey', 'Phoebe']);

		this.updateVis();
	}

	updateData(data) {
		// console.log([...data]);
		this.mainCharacters = [
			'Rachel',
			'Ross',
			'Chandler',
			'Monica',
			'Joey',
			'Phoebe',
		];
		this.uniqueCharacters = Array.from(
			new Set(
				characterFormBuilder.checkboxs
					.filter(
						(c) =>
							c.checked &&
							this.mainCharacters.includes(
								c.getAttribute('data-character')
							)
					)
					.map((c) => c.getAttribute('data-character'))
			)
		);
		//console.log(this.uniqueCharacters);
		this.activeSeasons = Array.from(
			new Set(
				episodeFormBuilder.treeItems
					.filter((c) => c.selected === true)
					.map((c) => c.getAttribute('data-season'))
			)
		);
		//console.log(this.activeSeasons);
		this.characterLines = [];
		this.uniqueCharacters.forEach((d) => {
			this.characterLines.push({ key: d, values: [] });
			this.activeSeasons.forEach((d) => {
				this.characterLines[this.characterLines.length - 1].values.push({
					season: d,
					lines: 0,
				});
			});
			//console.log(data);
			data.forEach((e) => {
				e.scenes.forEach((f) => {
					f.lines.forEach((g) => {
						/*if(g.quoteFrom === 'Rachel'){
                    //console.log(g.quoteFrom);
                    console.log('episode: '+e.episode+' scene: '+f.scene);
                }*/
						if (
							e.speakers.includes(
								this.characterLines[this.characterLines.length - 1].key
							)
						) {
							let currentCharacter = this.characterLines.length - 1;
							let currentSeason = this.activeSeasons.indexOf(
								e.season.toString()
							);
							this.characterLines[currentCharacter].values[
								currentSeason
							].lines =
								this.characterLines[currentCharacter].values[
									currentSeason
								].lines + 1;
						}
					});
				});
			});
		});
		// console.log(this.characterLines);
		this.updateVis();
	}

	updateVis() {
		this.setWidthAndHeight();

		let max = -1;
		this.characterLines.forEach((d) => {
			d.values.forEach((e) => {
				if (+e.lines > max) {
					max = +e.lines;
				}
			});
		});
		//console.log('max: '+max);

		//console.log('updateVis() width: '+this.width+' height: '+this.height);
		this.x
			.domain(
				d3.extent(this.activeSeasons.reduce((acc, x) => acc.concat(+x), []))
			)
			.range([
				this.config.margin.left,
				this.width - this.config.margin.left,
			]);
		this.y.domain([0, max]).range([this.height, 0]);

		this.svg.selectAll('path').data(this.characterLines).join('path');
		this.svg.selectAll('.line').data(this.characterLines).join('path');

		//https://d3-graph-gallery.com/graph/line_several_group.html
		//console.log('updateVis: '+ this.characterLines);
		if (this.characterLines != [] && this.characterLines !== null) {
			this.svg
				.selectAll('.line')
				.data(this.characterLines)
				.join('path')
				.attr('fill', 'none')
				.attr('stroke', (d) => this.colorScale(d.key))
				.attr('stroke-width', 1.5)
				.attr('d', function (d) {
					return d3
						.line()
						.x((d) => wordsLine.x(d.season))
						.y((d) => wordsLine.y(+d.lines))(d.values);
				});
			//.attr("d", function(d){
			//  return d3.line()
			//    .x((d) => (this.x(d.season)))
			//  .y((d) => (this.y(+d.episodes)))
			//(d.values)}
			//)
		}
		this.xAxisG.call(this.xAxis);
		this.yAxisG.call(this.yAxis);
	}

	setWidthAndHeight() {
		const svg = document.getElementById(this.config.id)?.querySelector('svg');
		if (svg) {
			this.width =
				svg.getBoundingClientRect().width -
				this.config.margin.left -
				this.config.margin.right;
			this.height =
				svg.getBoundingClientRect().height -
				this.config.margin.top -
				this.config.margin.bottom;
			//console.log('setWidthAndHeight() width: '+this.width+' height: '+this.height);

			//this.xAxisG?.attr("transform", `translate(${this.config.margin.left} ,${this.height})`);
			this.xAxisG?.attr('transform', `translate(0 ,${this.height})`);
			this.yAxisG?.attr(
				'transform',
				`translate(${this.config.margin.left} ,0)`
			);

			//this.clipPath?.attr("width", this.width).attr("height", this.height);

			//this.x?.range([0, this.width]);
			//this.y?.range([this.height, 0]);
		}
	}

	mouseOverTooltipCB(event, data) {}

	mouseLeaveTooltipCB(event) {
		d3.select('#tooltip')
			.style('opacity', '0')
			.style('pointer-events', 'none');
	}
}
