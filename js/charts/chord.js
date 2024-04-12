export class Chord {
   constructor(_config) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
         id: _config.id,
      };

      this.innerRadius = 0;
      this.outerRadius = 0;
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

      this.outerGroup = this.svg.append('g');
      this.outerGroup
         .attr('class', 'outer-group')
         .style('transform', 'translate(50%, 50%)');

      this.ribbonsGroup = this.svg.append('g');
      this.ribbonsGroup
         .attr('class', 'ribbons')
         .style('transform', 'translate(50%, 50%)');

      this.setWidthAndHeight();

      this.chord = d3
         .chord()
         .padAngle(20 / this.innerRadius)
         .sortSubgroups(d3.descending);
      this.arc = d3
         .arc()
         .innerRadius(this.innerRadius)
         .outerRadius(this.outerRadius);
      this.ribbon = d3.ribbon().radius(this.innerRadius);
      this.defs = this.svg.append('defs');

      this.colorScale = d3
         .scaleOrdinal(d3.schemeTableau10)
         .domain(
            characterFormBuilder.checkboxs.map((c) =>
               c.getAttribute('data-character')
            )
         );
   }

   updateData(data) {
      this.uniqueCharacters = Array.from(
         new Set(
            characterFormBuilder.checkboxs
               .filter((c) => c.checked)
               .map((c) => c.getAttribute('data-character'))
         )
      );

      // Initialize empty matrix
      this.characterMatrix = Array.from(
         { length: this.uniqueCharacters.length },
         () => Array.from({ length: this.uniqueCharacters.length }, () => 0)
      );

      data.forEach((d) => {
         d.scenes.forEach((s) => {
            this.uniqueCharacters.forEach((c, i) => {
               const match = s.speakers.find((s) => s === c);
               if (match) {
                  this.characterMatrix[i][i]++;
               }
            });

            const permutations = [];

            for (let i = 0; i < s.speakers.length; i++) {
               for (let j = i + 1; j < s.speakers.length; j++) {
                  permutations.push([s.speakers[i], s.speakers[j]]);
               }
            }

            permutations.forEach((p) => {
               const [speaker1, speaker2] = p;
               const index1 = this.uniqueCharacters.indexOf(speaker1);
               const index2 = this.uniqueCharacters.indexOf(speaker2);
               if (index1 >= 0 && index2 >= 0) {
                  this.characterMatrix[index1][index2]++;
                  this.characterMatrix[index2][index1]++;
               }
            });
         });
      });

      this.updateVis();
   }

   updateVis() {
      this.setWidthAndHeight();

      const chords = this.chord(this.characterMatrix);

      const groups = this.outerGroup
         .selectAll('g')
         .data(chords.groups)
         .join('g')
         .attr('class', 'group');

      groups
         .selectAll('path.character-label')
         .data((d) => [d])
         .join('path')
         .attr('class', `character-label`)
         .attr('id', (d) => this.uniqueCharacters[d.index])
         .attr('fill', 'none')
         .attr('d', () =>
            d3.arc()({
               outerRadius: this.outerRadius,
               startAngle: 0,
               endAngle: 2 * Math.PI,
            })
         );
      groups
         .selectAll('path.group-path')
         .data((d) => [d])
         .join('path')
         .attr('class', `group-path`)
         .attr('fill', (d) => this.colorScale(this.uniqueCharacters[d.index]))
         .transition()
         .delay((d, i) => {
            return i * 5 + 10;
         })
         .attr('d', this.arc);
      const text = groups
         .selectAll('text')
         .data((d) => [d])
         .join('text')
         .attr('dy', -5);
      text
         .selectAll('textPath')
         .data((d) => [d])
         .join('textPath')
         .attr('xlink:href', (d) => `#${this.uniqueCharacters[d.index]}`)
         .attr('startOffset', (d) => d.startAngle * this.outerRadius)
         .text((d) => this.uniqueCharacters[d.index]);

      // const linearGradients = this.defs
      //    .selectAll('linearGradient')
      //    .data(chords)
      //    .join('linearGradient')
      //    .attr('id', (d) => `${d.source.index}-${d.target.index}`);
      // linearGradients
      //    .selectAll('stop')
      //    .data((d) => {
      //       return [
      //          { ...d.source, offset: '0%' },
      //          { ...d.target, offset: '100%' },
      //       ];
      //    })
      //    .join('stop')
      //    .attr('offset', (d) => d.offset)
      //    .attr('stop-color', (d) =>
      //       this.colorScale(this.uniqueCharacters[d.index])
      //    );

      this.ribbonsGroup
         .selectAll('path')
         .data(chords)
         .join('path')
         .attr('fill-opacity', 0.7)
         .attr('fill', (d) =>
            this.colorScale(this.uniqueCharacters[d.source.index])
         ) //`url(#${d.source.index}-${d.target.index})`)
         .attr('stroke', 'white')
         .attr(
            'class',
            (d) =>
               `ribbon-source-${d.source.index} ribbon-target-${d.target.index}`
         )
         .transition()
         .delay((d, i) => {
            return i * 5 + 10;
         })
         .attr('d', this.ribbon);

      groups
         .selectAll('path.group-path')
         .on('mouseenter', (event, k) => {
            const groupMatch = chords.find(
               (c) => c.source.index === k.index && c.target.index === k.index
            );
            this.mouseOverTooltipCB(event, groupMatch);

            d3.selectAll(`.ribbon-source-${k.index}`)
               .transition()
               .delay((d, i) => {
                  return i * 5 + 10;
               })
               .attr('fill-opacity', 1)
               .attr('fill', (d) =>
                  this.colorScale(this.uniqueCharacters[d.source.index])
               );
            d3.selectAll(`.ribbon-target-${k.index}`)
               .transition()
               .delay((d, i) => {
                  return i * 5 + 10;
               })
               .attr('fill-opacity', 1)
               .attr('fill', (d) =>
                  this.colorScale(this.uniqueCharacters[k.index])
               );
         })
         .on('mouseleave', (event, k) => {
            this.mouseLeaveTooltipCB();

            d3.selectAll(`.ribbon-source-${k.index}`)
               .transition()
               .delay((d, i) => {
                  return i * 5 + 10;
               })
               .attr('fill-opacity', 0.7)
               .attr('fill', (d) =>
                  this.colorScale(this.uniqueCharacters[d.source.index])
               );
            d3.selectAll(`.ribbon-target-${k.index}`)
               .transition()
               .delay((d, i) => {
                  return i * 5 + 10;
               })
               .attr('fill-opacity', 0.7)
               .attr('fill', (d) =>
                  this.colorScale(this.uniqueCharacters[d.source.index])
               );
         });

      this.ribbonsGroup
         .selectAll('path')
         .on('mouseenter', (event, k) => {
            this.mouseOverTooltipCB(event, k);
            d3.select(event.target).attr('fill-opacity', 1);
         })
         .on('mouseleave', (event) => {
            this.mouseLeaveTooltipCB();
            d3.select(event.target).attr('fill-opacity', 0.7);
         });
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

         this.outerRadius = Math.max(
            Math.min(this.width, this.height) * 0.5 - 30,
            0
         );
         this.innerRadius = Math.max(this.outerRadius - 20, 0);

         this.chord?.padAngle(20 / this.innerRadius);
         this.arc?.innerRadius(this.innerRadius).outerRadius(this.outerRadius);
         this.ribbon?.radius(this.innerRadius);
      }
   }

   mouseOverTooltipCB(event, data) {
      const tooltip = d3.select('#tooltip');
      const tooltipElm = tooltip.node();
      const tooltipBounds = tooltipElm.getBoundingClientRect();
      const chartBounds = this.config.parentElement.getBoundingClientRect();
      const { pageX, pageY } = event;

      tooltip
         .style('pointer-events', 'all')
         .style('opacity', '1')
         .style(
            'left',
            Math.min(
               pageX,
               chartBounds.x + chartBounds.width - tooltipBounds.width
            ) + 'px'
         )
         .style(
            'top',
            Math.min(
               pageY,
               chartBounds.y + chartBounds.height - tooltipBounds.height
            ) +
               10 +
               'px'
         )
         .html(() => {
            const sourceCharacter = `<strong>${
               this.uniqueCharacters[data.source.index]
            }</strong>`;
            const targetCharacter = `<strong>${
               this.uniqueCharacters[data.target.index]
            }</strong>`;
            const totalScenes = data.source.value;
            const scenesWord = 'scene' + (totalScenes === 1 ? '' : 's');

            return targetCharacter === sourceCharacter
               ? `<p>${sourceCharacter} is in ${totalScenes} ${scenesWord}</p>`
               : `<p>${sourceCharacter} has ${totalScenes} ${scenesWord} with ${targetCharacter}</p>`;
         });
   }

   mouseLeaveTooltipCB(event) {
      d3.select('#tooltip')
         .style('opacity', '0')
         .style('pointer-events', 'none');
   }
}
