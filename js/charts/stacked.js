export class Stacked {
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
        this.yAxisTitle = '# of Episodes';
        this.characterEpisodes = [];
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

        this.xtitle = this.svg.append('text')
            .attr('x', 200)
            .attr('y', 140)
            .text(this.xAxisTitle);
      
        this.ytitle = this.svg.append('text')
            .attr('x', -110)
            .attr('y', 12)
            .text(this.yAxisTitle)
            .style('transform','rotate(270deg)');

        this.x = d3.scaleLinear()
            .domain([1, 10])
            .range([ this.config.margin.left, this.width-this.config.margin.left]);

        this.xAxis = d3.axisBottom().scale(this.x);

        this.xAxisG = this.svg.append('g').attr("transform", "translate("+(this.config.margin.left)+"," + this.height + ")")
        
        /*this.xAxisG = this.svg.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .call(d3.axisBottom(this.x).ticks(5));*/
        
        this.y = d3.scaleLinear()
            .domain([0, 30])
            .range([ this.height, 0 ]);

        this.yAxis = d3.axisLeft().scale(this.y);

        this.yAxisG = this.svg.append('g');
        
        /*this.yAxisG = this.svg.append("g")
            .call(d3.axisLeft(this.y));*/

        this.colorScale = d3
        .scaleOrdinal(d3.schemeTableau10)
        .domain(
            ['Rachel','Ross','Chandler','Monica','Joey','Phoebe']
        );

        this.updateVis();
    }

    updateData(data) {
        this.mainCharacters = ['Rachel','Ross','Chandler','Monica','Joey','Phoebe'];
        this.uniqueCharacters = Array.from(
            new Set(
               characterFormBuilder.checkboxs
                  .filter((c) => c.checked && this.mainCharacters.includes(c.getAttribute('data-character')))
                  .map((c) => c.getAttribute('data-character'))
            )
        );
        //console.log(this.uniqueCharacters);
        this.activeEpisodes = Array.from(
            new Set(
               episodeFormBuilder.treeItems
                  .filter((c) => c.selected === true)
                  .map((c) => 
                    c.getAttribute('data-key'))
            )
        );

        this.episodeLines = [];
        this.activeEpisodes.forEach((d) => {
            this.episodeLines.push({group:d, columns:{0:'group'}})
            for (let i = 0; i < this.uniqueCharacters.length; i++){
                this.episodeLines[this.episodeLines.length-1][this.uniqueCharacters[i]] = 0;
                this.episodeLines[this.episodeLines.length-1].columns[i+1] = this.uniqueCharacters[i];
            }
        })

        for (let i = 0; i < this.episodeLines.length; i++) {
            data[i].scenes.forEach((d) => {
                d.lines.forEach((e) => {
                    if(this.uniqueCharacters.includes(e.quoteFrom[0].toUpperCase()+e.quoteFrom.substr(1).toLowerCase())){
                        this.episodeLines[i][e.quoteFrom[0].toUpperCase()+e.quoteFrom.substr(1).toLowerCase()] = this.episodeLines[i][e.quoteFrom[0].toUpperCase()+e.quoteFrom.substr(1).toLowerCase()] + 1;
                    }
                })
            })
        }

        this.stackedData = d3.stack().keys(this.uniqueCharacters)(this.episodeLines);
        
        //console.log(this.episodeLines);
        //console.log(this.stackedData);
        this.updateVis();
    }
 
    updateVis() {
        this.setWidthAndHeight();
    
        let max = -1;
        this.characterEpisodes.forEach((d) => {
            d.values.forEach((e) => {
                if(+e.episodes > max){
                    max = +e.episodes;
                }
            })
        })
        //console.log('max: '+max);

        //console.log('updateVis() width: '+this.width+' height: '+this.height);
        this.x.domain(d3.extent(this.activeSeasons.reduce( (acc, x ) => acc.concat(+x), []))).range([this.config.margin.left,this.width-this.config.margin.left]);
        this.y.domain([0,max]).range([this.height,0]);

        this.svg.selectAll("path")
            .data(this.characterEpisodes)
            .join("path")

        //https://d3-graph-gallery.com/graph/barplot_stacked_basicWide.html
        //console.log('updateVis: '+ this.characterEpisodes);
        if(this.characterEpisodes != [] && this.characterEpisodes !== null){
            this.svg.selectAll(".line")
            .data(this.characterEpisodes)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", (d) => this.colorScale(d.key) )
            .attr("stroke-width", 1.5)
            .attr("d", function(d){
                return d3.line()
                    .x((d) => (episodesLine.x(d.season)))
                    .y((d) => (episodesLine.y(+d.episodes)))
                (d.values)}
            )
            /*.attr("d", function(d){
                return d3.line()
                    .x((d) => (this.x(d.season)))
                    .y((d) => (this.y(+d.episodes)))
                (d.values)}
            )*/
        }
        this.xAxisG.call(this.xAxis);
        this.yAxisG.call(this.yAxis);
    }

    setWidthAndHeight() {
        /*if (this.svg?.node()) {
            this.width =
               this.svg.node().getBoundingClientRect().width -
               this.config.margin.left -
               this.config.margin.right;
            this.height =
               this.svg.node().getBoundingClientRect().height -
               this.config.margin.top -
               this.config.margin.bottom;
        }*/
        const svg = document.getElementById(this.config.id)?.querySelector("svg");
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
            this.xAxisG?.attr("transform", `translate(0 ,${this.height})`);
            this.yAxisG?.attr("transform", `translate(${this.config.margin.left} ,0)`);

            //this.clipPath?.attr("width", this.width).attr("height", this.height);

            this.x?.range([0, this.width]);
            this.y?.range([this.height, 0]);
        }
    }

    mouseOverTooltipCB(event, data) {

    }

    mouseLeaveTooltipCB(event) {
       d3.select('#tooltip')
          .style('opacity', '0')
          .style('pointer-events', 'none');
    }
 }