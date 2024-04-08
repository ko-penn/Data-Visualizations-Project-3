export class CharacterFormBuilder {
   constructor() {
      this.form = document.getElementById('characters-selector');
      if (!this.form) {
         console.error('Form element does not exist');
      }
      if (this.form.children.length === 0) {
         this.buildForm();
      }
   }

   buildForm() {
      this.buildCharactersToggles();
      this.registerChangeCallbacks();
      requestAnimationFrame(() => {
         this.handleChange();
      });
   }

   registerChangeCallbacks() {}

   handleChange() {
      handleGlobalFilterChange();
   }

   buildCharactersToggles() {
      const h3 = document.createElement('h3');
      h3.style.padding = '.5em 0';
      h3.innerText = 'Characters';
      this.form.append(h3);

      const characterImportance = {};
      rawData.forEach((d) => {
         d.scenes.forEach((s) => {
            s.lines.forEach((l) => {
               if (!characterImportance[l.speaker])
                  characterImportance[l.speaker] = 0;
               characterImportance[l.speaker]++;
            });
         });
      });

      const sortedCharacterImportance = Object.keys(characterImportance)
         .sort((a, b) => characterImportance[b] - characterImportance[a])
         .map((k) => ({
            character: k,
            characterImportance: characterImportance[k],
         }));

      const buildCheckbox = (c, checked) => {
         const characterItemCheckbox = document.createElement('sl-checkbox');
         characterItemCheckbox.innerText = `${c.character}`;
         characterItemCheckbox.checked = checked;
         characterItemCheckbox.addEventListener('sl-change', () => {
            this.handleChange();
         });
         return characterItemCheckbox;
      };

      const h6 = document.createElement('h6');
      h6.style.padding = '.5em 0';
      h6.innerText = 'Main Characters';
      this.form.append(h6);

      const mainCheckboxs = sortedCharacterImportance
         .slice(0, 6)
         .map((c) => buildCheckbox(c, true));
      this.form.append(...mainCheckboxs);

      const summary = document.createElement('sl-details');
      summary.summary = 'Other Characters';

      const otherCheckboxs = sortedCharacterImportance
         .slice(6, sortedCharacterImportance.length)
         .map((c) => buildCheckbox(c, false));
      summary.append(...otherCheckboxs);

      this.form.append(summary);
   }
}
