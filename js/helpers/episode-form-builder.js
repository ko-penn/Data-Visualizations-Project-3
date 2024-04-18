export class EpisodeFormBuilder {
   constructor() {
      this.form = document.getElementById('episodes-selector');
      if (!this.form) {
         console.error('Form element does not exist');
      }
      if (this.form.children.length === 0) {
         this.buildForm();
      }
   }

   buildForm() {
      this.buildEpisodesTree();
      this.registerChangeCallbacks();
      requestAnimationFrame(() => {
         this.handleChange();
      });
   }

   registerChangeCallbacks() {}

   handleChange() {
      handleGlobalFilterChange();
      this.updateTooltipBadges();
   }

   async buildEpisodesTree() {
      const h3 = document.createElement('h3');
      h3.style.padding = '.5em';
      h3.innerText = 'Episodes';
      this.buildTooltip();

      const header = document.createElement('div');
      header.append(h3);
      header.append(this.episodesTotalTooltip);
      header.style.display = 'flex';
      header.style['justifyContent'] = 'space-between';
      header.style['alignItems'] = 'center';
      header.style.width = '100%';
      this.form.append(header);

      const tree = document.createElement('sl-tree');
      tree.selection = 'multiple';
      const seasons = {};
      rawData.forEach((d) => {
         if (seasons[d.season]) {
            seasons[d.season][d.episode] = d;
         } else {
            seasons[d.season] = { [d.episode]: d };
         }
      });

      this.treeItems = [];

      for (let k of Object.keys(seasons)) {
         const seasonTreeItem = document.createElement('sl-tree-item');
         seasonTreeItem.innerText = `Season ${k}`;
         seasonTreeItem.selected = true;

         Object.keys(seasons[k]).forEach((e) => {
            const episodeTreeItem = document.createElement('sl-tree-item');
            episodeTreeItem.innerText = `Episode ${e}: ${seasons[k][e].title}`;
            episodeTreeItem.setAttribute('data-key', `${k}-${e}`);
            episodeTreeItem.setAttribute('data-season', k);
            episodeTreeItem.setAttribute('data-episode', e);
            episodeTreeItem.selected = true;

            this.treeItems.push(episodeTreeItem);
            seasonTreeItem.append(episodeTreeItem);
         });
         tree.append(seasonTreeItem);
      }

      tree.addEventListener('sl-selection-change', () => this.handleChange());

      this.form.append(tree);
   }

   buildTooltip() {
      this.episodesTotalTooltip = document.createElement('sl-tooltip');

      this.tooltipInfoBadge = document.createElement('sl-badge');
      this.tooltipInfoBadge.variant = 'primary';
      this.tooltipInfoBadge.pill = true;
      this.episodesTotalTooltip.append(this.tooltipInfoBadge);

      this.episodesTotalTooltipContent = document.createElement('div');
      this.episodesTotalTooltipContent.slot = 'content';

      this.episodesTotalTooltipMenu = document.createElement('sl-menu');
      const label = document.createElement('sl-menu-label');
      label.innerText = 'Total Episodes Selected';
      this.episodesTotalTooltipMenu.append(label);

      const seasons = rawData.reduce((acc, curr) => {
         acc.add(curr.season);
         return acc;
      }, new Set());

      this.seasonItemPills = {};

      for (let season of seasons) {
         const seasonItem = document.createElement('sl-menu-item');
         seasonItem.innerText = `Season ${season}`;
         const seasonItemPill = document.createElement('sl-badge');
         seasonItemPill.variant = 'neutral';
         seasonItemPill.slot = 'suffix';
         seasonItemPill.pill = true;
         seasonItem.append(seasonItemPill);
         this.seasonItemPills[season] = seasonItemPill;
         this.episodesTotalTooltipMenu.append(seasonItem);
      }

      this.episodesTotalTooltipContent.append(this.episodesTotalTooltipMenu);
      this.episodesTotalTooltip.append(this.episodesTotalTooltipContent);
   }

   updateTooltipBadges() {
      const totalSeasonCounts = {};
      const totalSelectedSeasonsCounts = {};
      rawData.forEach((d) => {
         const { season, episode } = d;
         if (!totalSelectedSeasonsCounts[season]) {
            totalSelectedSeasonsCounts[season] = new Set();
         }
         if (!totalSeasonCounts[season]) {
            totalSeasonCounts[season] = new Set();
         }
         totalSeasonCounts[season].add(episode);
      });

      this.treeItems.forEach((c) => {
         if (c.selected) {
            const season = c.getAttribute('data-season');
            const episode = c.getAttribute('data-episode');
            if (!totalSelectedSeasonsCounts[season]) {
               totalSelectedSeasonsCounts[season] = new Set();
            }
            totalSelectedSeasonsCounts[season].add(episode);
         }
      });

      let totalCount = 0;
      Object.keys(totalSelectedSeasonsCounts).forEach((k) => {
         const item = this.seasonItemPills[k];
         const seasonCount = totalSelectedSeasonsCounts[k].size;
         item.innerText = seasonCount;
         totalCount += seasonCount;
         if (totalSeasonCounts[k].size === seasonCount) {
            item.variant = 'success';
         } else {
            item.variant = 'neutral';
         }
      });

      this.tooltipInfoBadge.innerText = totalCount;
   }
}
