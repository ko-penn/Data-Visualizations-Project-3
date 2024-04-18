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

      this.checkboxs.forEach((c) => {
         if (c.checked) {
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

   buildEpisodesTree() {
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
      const seasons = {};
      rawData.forEach((d) => {
         if (seasons[d.season]) {
            seasons[d.season][d.episode] = d;
         } else {
            seasons[d.season] = { [d.episode]: d };
         }
      });

      this.checkboxs = [];

      Object.keys(seasons).forEach((k) => {
         const seasonTreeItem = document.createElement('sl-tree-item');
         const seasonItemCheckbox = document.createElement('sl-checkbox');
         seasonItemCheckbox.innerText = `Season ${k}`;
         seasonItemCheckbox.checked = true;

         seasonTreeItem.append(seasonItemCheckbox);
         const seasonCheckboxs = [];
         Object.keys(seasons[k]).forEach((e) => {
            const episodeTreeItem = document.createElement('sl-tree-item');
            const episodeItemCheckbox = document.createElement('sl-checkbox');
            episodeItemCheckbox.setAttribute('data-key', `${k}-${e}`);
            episodeItemCheckbox.setAttribute('data-season', k);
            episodeItemCheckbox.setAttribute('data-episode', e);
            episodeItemCheckbox.innerText = `Episode ${e}: ${seasons[k][e].title}`;
            episodeItemCheckbox.checked = true;
            this.checkboxs.push(episodeItemCheckbox);

            seasonCheckboxs.push(episodeItemCheckbox);
            episodeTreeItem.append(episodeItemCheckbox);
            seasonTreeItem.append(episodeTreeItem);

            episodeItemCheckbox.addEventListener('sl-change', () => {
               if (
                  seasonItemCheckbox.checked &&
                  seasonCheckboxs.some((c) => !c.checked)
               ) {
                  seasonItemCheckbox.checked = false;
               } else if (
                  !seasonItemCheckbox.checked &&
                  !seasonCheckboxs.some((c) => !c.checked)
               ) {
                  seasonItemCheckbox.checked = true;
               }
               this.handleChange();
            });
         });

         seasonItemCheckbox.addEventListener('sl-change', () => {
            seasonCheckboxs.forEach((c) => {
               c.checked = seasonItemCheckbox.checked;
               this.handleChange();
            });
         });
         tree.append(seasonTreeItem);
      });

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
}
