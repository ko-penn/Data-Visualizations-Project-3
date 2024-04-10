export class Chord {
   constructor(_config, _data) {
      this.config = {
         parentElementSelector: _config.parentElementSelector,
         parentElement: document.querySelector(_config.parentElementSelector),
         margin: _config.margin || { top: 25, right: 25, bottom: 25, left: 45 },
         id: _config.id,
      };
      this.data = _data;
      this.initVis();

      window.addEventListener('resize', () => {
         this.updateVis();
      });
   }

   initVis() {
      this.updateVis();
   }

   updateData(data) {
      this.data = data;
      this.updateVis();
   }

   updateVis() {
      this.setWidthAndHeight();
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
      }
   }
}
