export class Episodes {
   constructor(_config) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
         id: _config.id,
      };

      this.width = 0;
      this.height = 0;

      this.initVis();

      window.addEventListener('resize', () => {
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

      this.svg = this.mainDiv
         .append('svg')
         .attr('width', '100%')
         .attr('height', '100%');

      this.setWidthAndHeight();

      this.x = d3.scaleLinear().domain([1, 10]).range([0, this.width]);

      this.xAxisG = this.svg
         .append('g')
         // .attr('transform', 'translate(0,' + this.height + ')')
         .call(d3.axisBottom(this.x).ticks(5));

      this.y = d3.scaleLinear().domain([0, 30]).range([this.height, 0]);

      this.yAxisG = this.svg.append('g').call(d3.axisLeft(this.y));

      this.colorScale = d3
         .scaleOrdinal(d3.schemeTableau10)
         .domain(['Rachel', 'Ross', 'Chandler', 'Monica', 'Joey', 'Phoebe']);
   }

   updateData(data) {
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
      this.activeSeasons = Array.from(
         new Set(
            episodeFormBuilder.treeItems
               .filter((c) => c.selected)
               .map((c) => c.getAttribute('data-season'))
         )
      );
      this.characterEpisodes = [];
      this.uniqueCharacters.forEach((d) => {
         this.characterEpisodes.push({ key: d, values: [] });
         this.activeSeasons.forEach((d) => {
            this.characterEpisodes[
               this.characterEpisodes.length - 1
            ].values.push({ season: d, episodes: 0 });
         });
         data.forEach((e) => {
            if (
               e.speakers.includes(
                  this.characterEpisodes[this.characterEpisodes.length - 1].key
               )
            ) {
               let currentCharacter = this.characterEpisodes.length - 1;
               let currentSeason = this.activeSeasons.indexOf(
                  e.season.toString()
               );
               this.characterEpisodes[currentCharacter].values[
                  currentSeason
               ].episodes =
                  this.characterEpisodes[currentCharacter].values[currentSeason]
                     .episodes + 1;
            }
         });
      });

      //console.log(this.characterEpisodes);
      this.updateVis();
   }

   updateVis() {
      this.setWidthAndHeight();
      //https://d3-graph-gallery.com/graph/line_several_group.html
      this.svg
         .selectAll('.line')
         .data(this.characterEpisodes)
         .join('path')
         .attr('class', 'line')
         .attr('fill', 'none')
         .attr('stroke', (d) => this.colorScale(d.key))
         .attr('stroke-width', 1.5)
         .attr('d', function (d) {
            return d3
               .line()
               .x((d) => episodesLine.x(d.season))
               .y((d) => episodesLine.y(+d.episodes))(d.values);
         });
      /*.attr("d", function(d){
                return d3.line()
                    .x((d) => (this.x(d.season)))
                    .y((d) => (this.y(+d.episodes)))
                (d.values)}
            )*/

      this.x.range([0, this.width]);
      this.y.range([this.height, 0]);
      this.xAxisG.call(d3.axisBottom(this.x).ticks(5));
      this.yAxisG.call(d3.axisLeft(this.y));
   }

   xScale(value) {
      return this.x(value);
   }

   yScale(value) {
      return this.y(value);
   }

   setWidthAndHeight() {
      if (this.svg?.node()) {
         this.width =
            this.svg.node().getBoundingClientRect().width -
            this.config.margin.left -
            this.config.margin.right;
         this.height =
            this.svg.node().getBoundingClientRect().height -
            this.config.margin.top -
            this.config.margin.bottom;
      }
   }

   mouseOverTooltipCB(event, data) {}

   mouseLeaveTooltipCB(event) {
      d3.select('#tooltip')
         .style('opacity', '0')
         .style('pointer-events', 'none');
   }
}
