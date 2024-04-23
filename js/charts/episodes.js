export class Episodes {
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
             .attr('id', this.config.id)
             .style("display", "grid")
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
        
        this.x = d3.scaleLinear()
            .domain([1, 10])
            .range([ 0, this.width]);

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
        this.activeSeasons = Array.from(
            new Set(
               episodeFormBuilder.treeItems
                  .filter((c) => c.selected === true)
                  .map((c) => c.getAttribute('data-season'))
            )
        );
        this.characterEpisodes = [];
        this.uniqueCharacters.forEach((d) => {
            this.characterEpisodes.push({key: d,values:[]});
            this.activeSeasons.forEach((d) => {
                this.characterEpisodes[this.characterEpisodes.length-1].values.push({season:d,episodes:0})
            })
            data.forEach((e) => {
                if(e.speakers.includes(this.characterEpisodes[this.characterEpisodes.length-1].key)){
                    let currentCharacter = (this.characterEpisodes.length-1);
                    let currentSeason = (this.activeSeasons.indexOf(e.season.toString()));
                    this.characterEpisodes[currentCharacter].values[currentSeason].episodes = this.characterEpisodes[currentCharacter].values[currentSeason].episodes + 1;
                }
            })
        });
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
       
        this.x.domain(d3.extent(this.activeSeasons.reduce( (acc, x ) => acc.concat(+x), []))).range([0,this.width]);
        this.y.domain([0,max]).range([this.height,0]);

        this.dataGroup.selectAll("path")
            .data(this.characterEpisodes)
            .join("path");
        this.dataGroup.selectAll('.line')
            .data(this.characterEpisodes)
            .join("path");

        //https://d3-graph-gallery.com/graph/line_several_group.html
        if(this.characterEpisodes != [] && this.characterEpisodes !== null){
            this.dataGroup.selectAll(".line")
            .data(this.characterEpisodes)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", (d) => this.colorScale(d.key) )
            .attr("stroke-width", 1.5)
            .attr("d", function(d){
                return d3.line()
                    .x((d) => (episodesLine.x(d.season)))
                    .y((d) => (episodesLine.y(+d.episodes)))
                (d.values)});
            /*.on('mouseover', (event,d) => {
                console.log(event,d);
                let name = d.key;
                let text = '';
                for(let i = 0; i<(d.values.length); i++){
                    let season = d.values[i]['season'];
                    let numEpis = d.values[i]['episodes'];
                    text = text.concat(season,': ',numEpis,'<br>');
                }
                d3.select('#tooltipstacked')
                  .style('display', 'block')
                  .style('left', (event.pageX+this.xtooltippadding) + 'px')   
                  .style('top', (event.pageY+this.ytooltippadding) + 'px')
                  .html(`<h3>${name}</h3>
                    <p>${text}</p>
                `);
                })
              .on('mouseleave', () => {
                d3.select('#tooltipstacked').style('display', 'none');
              });*/
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

            this.xAxisG?.attr("transform", `translate(0 ,${this.height})`);

            this.clipPath?.attr("width", this.width).attr("height", this.height);
        }
    }
 }