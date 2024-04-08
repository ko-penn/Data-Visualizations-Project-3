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
   }

   buildEpisodesTree() {
      const h3 = document.createElement('h3');
      h3.style.padding = '.5em';
      h3.innerText = 'Episode/Season';
      this.form.append(h3);
      const tree = document.createElement('sl-tree');
      const seasons = {};
      rawData.forEach((d) => {
         if (seasons[d.season]) {
            seasons[d.season][d.episode] = d;
         } else {
            seasons[d.season] = { [d.episode]: d };
         }
      });

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
            episodeItemCheckbox.innerText = `Episode ${e}: ${seasons[k][e].title}`;
            episodeItemCheckbox.checked = true;

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
}
