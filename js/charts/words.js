export class Words {
    constructor(_config) {
       this.config = {
          parentElementSelector: _config.parentElementSelector,
          parentElement: document.querySelector(_config.parentElementSelector),
          margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
          id: _config.id,
          groupingKey: _config.groupingKey || 'scene',
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



    }

    updateData(data) {


        this.updateVis();
    }
 
    updateVis() {
       this.setWidthAndHeight();


    }

    setWidthAndHeight() {

    }

    mouseOverTooltipCB(event, data) {
        
    }

    mouseLeaveTooltipCB(event) {
       d3.select('#tooltip')
          .style('opacity', '0')
          .style('pointer-events', 'none');
    }
 }