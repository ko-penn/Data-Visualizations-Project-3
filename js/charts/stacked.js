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
        this.xAxisTitle = 'Episodes';
        this.yAxisTitle = '# of Lines';
        this.uniqueCharacters = [];
        this.characterEpisodes = [];
        this.activeEpisodes = [];
        this.activeSeasons = [];
        this.stackedData = [];
        this.xtooltippadding = 10;
        this.ytooltippadding = -50;

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
             .attr('id', this.config.id).style("display", "grid")
             .style(
               "grid-template-areas",
               `
                       "y chart chart chart chart"
                       "y chart chart chart chart"
                       "y chart chart chart chart"
                       "y chart chart chart chart"
                       ". x x x x"
                       ". legend legend legend legend"
                    `
             )
             .style("grid-template-columns", "max-content repeat(4, 1fr)")
             .style("grid-template-rows", "repeat(4, 1fr) repeat(2, max-content)");
        } else {
            this.mainDiv = d3.select(
             `${this.config.parentElementSelector} #${this.config.id}`
            );
        }

        this.setWidthAndHeight();

        this.mainDiv
        .append("p")
        .attr("class", "y-axis-title")
        .style("grid-area", "y")
        .style("writing-mode", "vertical-rl")
        .style("text-orientation", "mixed")
        .style("text-align", "center")
        .style("transform", "rotate(180deg)")
        .text(this.yAxisTitle);
  
        this.mainDiv
        .append("p")
        .attr("class", "x-axis-title")
        .style("grid-area", "x")
        .style("text-align", "center")
        .text(this.xAxisTitle);

        this.svg = this.mainDiv
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style("grid-area", "chart");

        this.chart = this.svg
            .append("g")
            .attr(
              "transform",
              `translate(${this.config.margin.left},${this.config.margin.top / 2})`
        );

        this.dataGroup = this.chart
        .append("g")
        .attr("class", "data-group")
        .attr("clip-path", `url(#${this.config.id}-clip)`);

        this.x = d3.scaleBand()
            .range([ this.config.margin.left, this.width-this.config.margin.left]);

        this.xAxis = d3.axisBottom().scale(this.x);

        this.xAxisG = this.chart
            .append("g")
            .attr("class", "axis x-axis")
            .attr("clip-path", `url(#${this.config.id}-clip)`);
        
        this.y = d3.scaleLinear()
            .domain([0, 30])
            .range([ this.height, 0 ]);

        this.yAxis = d3.axisLeft().scale(this.y);

        this.yAxisG = this.chart.append("g").attr("class", "axis y-axis");
        
        this.clipPath = this.svg
            .append("defs")
            .append("clipPath")
            .attr("id", `${this.config.id}-clip`)
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height);

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
        
        this.updateVis();
    }
 
    updateVis() {
        this.setWidthAndHeight();
    
        let max = -1;
        this.stackedData.forEach((d) => {
            d.forEach((e) => {
                if(e[1] > max){
                    max = e[1];
                }
            })
        })
        this.x.domain(this.activeEpisodes).range([0,this.width]);
        this.y.domain([0,max]).range([this.height,0]);

        //https://d3-graph-gallery.com/graph/barplot_stacked_basicWide.html
        if(this.stackedData != [] && this.stackedData !== null){
            this.dataGroup.selectAll("g")
                .data(this.stackedData)
                .join("g")
                    .attr("fill", (d) => this.colorScale(d.key))
                    .selectAll("rect")
                        .data((d) => d)
                        .join("rect")
                            .attr("x",function(d) { if(linesStacked.x(d.data.group)<0) {return(1)} else {return linesStacked.x(d.data.group)}})
                            .attr("y",function(d) { if(linesStacked.y(d[1])<0) {return(1)} else {return linesStacked.y(d[1])}})
                            .attr("height",function(d) { if((linesStacked.y(d[0]) - linesStacked.y(d[1]))<1){return(+0)} else {return (linesStacked.y(d[0]) - linesStacked.y(d[1]))}})
                            .attr("width",this.x.bandwidth())
                            .on('mouseover', (event,d) => {
                                let season = d['data']['group'].substring(0, d['data']['group'].indexOf('-'));
                                let episode = d['data']['group'].substring(d['data']['group'].indexOf('-')+1, d['data']['group'].length);
                                let text = '';
                                for(let i = 1; i<(Object.keys(d['data']['columns']).length); i++){
                                    let name = d['data']['columns'][i];
                                    text = text.concat(name,': ',d['data'][name],'<br>');
                                }
                                d3.select('#tooltipstacked')
                                  .style('display', 'block')
                                  .style('left', (event.pageX+this.xtooltippadding) + 'px')   
                                  .style('top', (event.pageY+this.ytooltippadding) + 'px')
                                  .html(`<h3>Season ${season} Episode ${episode}</h3>
                                    <p>${text}</p>
                                `);
                                })
                              .on('mouseleave', () => {
                                d3.select('#tooltipstacked').style('display', 'none');
                              });
        }
        
        this.xAxisG.call(this.xAxis);
        this.yAxisG.call(this.yAxis);
    }
    

    setWidthAndHeight() {
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

            this.xAxisG?.attr("transform", `translate(${0} ,${this.height})`);

            if(this.width<=0){
                this.width = 1;
            }
            if(this.height<=0){
                this.height = 1;
            }

            this.clipPath?.attr("width", this.width).attr("height", this.height);
        }
    }
 }