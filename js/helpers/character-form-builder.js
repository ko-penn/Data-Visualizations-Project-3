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
      handleGlobalFilterChange(true);
      this.updateTooltipBadges();
   }

   buildCharactersToggles() {
      const h3 = document.createElement('h3');
      h3.style.padding = '.5em 0';
      h3.innerText = 'Characters';
      this.buildTooltip();

      const header = document.createElement('div');
      header.append(h3);
      header.append(this.characterTotalTooltip);
      header.style.display = 'flex';
      header.style['justifyContent'] = 'space-between';
      header.style['alignItems'] = 'center';
      header.style.width = '100%';
      this.form.append(header);

      const characterImportance = {};
      rawData.forEach((d) => {
         d.scenes.forEach((s) => {
            s.lines.forEach((l) => {
               l.speakers.forEach((speaker) => {
                  if (!characterImportance[speaker])
                     characterImportance[speaker] = 0;
                  characterImportance[speaker]++;
               });
            });
         });
      });

      const sortedCharacterImportance = Object.keys(characterImportance)
         .sort((a, b) => characterImportance[b] - characterImportance[a])
         .map((k) => ({
            character: k,
            characterImportance: characterImportance[k],
         }));

      const buildCheckbox = (c, isMainCharacter) => {
         const characterItemCheckbox = document.createElement('sl-checkbox');
         characterItemCheckbox.innerText = `${c.character}`;
         characterItemCheckbox.checked = isMainCharacter;
         characterItemCheckbox.setAttribute('data-character', c.character);
         if (isMainCharacter) {
            characterItemCheckbox.setAttribute('data-is-main-character', true);
         }
         characterItemCheckbox.addEventListener('sl-change', () => {
            this.handleChange();
         });
         return characterItemCheckbox;
      };

      const h6 = document.createElement('h6');
      h6.style.padding = '.5em 0';
      h6.innerText = 'Main Characters';
      this.form.append(h6);

      this.checkboxs = [];

      const mainCheckboxs = sortedCharacterImportance
         .slice(0, 6)
         .map((c) => buildCheckbox(c, true));
      this.form.append(...mainCheckboxs);

      this.checkboxs.push(...mainCheckboxs);

      const summary = document.createElement('sl-details');
      summary.summary = 'Other Characters';

      const search = document.createElement('sl-input');
      search.placeholder = 'Search';
      search.size = 'medium';
      const icon = document.createElement('sl-icon');
      icon.name = 'search';
      icon.slot = 'suffix';
      search.append(icon);
      summary.append(search);

      const otherCheckboxs = sortedCharacterImportance
         .slice(6, sortedCharacterImportance.length)
         .map((c) => buildCheckbox(c, false));
      summary.append(...otherCheckboxs);

      this.checkboxs.push(...otherCheckboxs);

      search.addEventListener('sl-input', () => {
         otherCheckboxs.forEach((c) => {
            const character = c.getAttribute('data-character');
            if (
               !search.value ||
               character.toLowerCase().includes(search.value.toLowerCase())
            ) {
               c.classList.remove('hide');
            } else {
               c.classList.add('hide');
            }
         });
      });

      this.form.append(summary);
   }

   buildTooltip() {
      this.characterTotalTooltip = document.createElement('sl-tooltip');

      this.tooltipInfoBadge = document.createElement('sl-badge');
      this.tooltipInfoBadge.variant = 'primary';
      this.tooltipInfoBadge.pill = true;
      this.characterTotalTooltip.append(this.tooltipInfoBadge);

      this.characterTotalTooltipContent = document.createElement('div');
      this.characterTotalTooltipContent.slot = 'content';

      this.characterTotalTooltipMenu = document.createElement('sl-menu');
      const label = document.createElement('sl-menu-label');
      label.innerText = 'Total Characters Selected';
      this.characterTotalTooltipMenu.append(label);

      this.mainCharacterTotalMenuItem = document.createElement('sl-menu-item');
      this.mainCharacterTotalMenuItem.innerText = 'Main Characters';
      this.mainCharacterTotalPill = document.createElement('sl-badge');
      this.mainCharacterTotalPill.variant = 'success';
      this.mainCharacterTotalPill.slot = 'suffix';
      this.mainCharacterTotalPill.pill = true;
      this.mainCharacterTotalMenuItem.append(this.mainCharacterTotalPill);
      this.characterTotalTooltipMenu.append(this.mainCharacterTotalMenuItem);

      this.otherCharacterTotalMenuItem = document.createElement('sl-menu-item');
      this.otherCharacterTotalMenuItem.innerText = 'Other Characters';
      this.otherCharacterTotalPill = document.createElement('sl-badge');
      this.otherCharacterTotalPill.variant = 'neutral';
      this.otherCharacterTotalPill.slot = 'suffix';
      this.otherCharacterTotalPill.pill = true;
      this.otherCharacterTotalMenuItem.append(this.otherCharacterTotalPill);
      this.characterTotalTooltipMenu.append(this.otherCharacterTotalMenuItem);

      this.characterTotalTooltipContent.append(this.characterTotalTooltipMenu);
      this.characterTotalTooltip.append(this.characterTotalTooltipContent);
   }

   updateTooltipBadges() {
      let totalMainCharactersSelected = 0;
      let totalOtherCharactersSelected = 0;
      this.checkboxs.forEach((c) => {
         if (c.checked) {
            const isMainCharacter = c.getAttribute('data-is-main-character');
            if (isMainCharacter) {
               totalMainCharactersSelected++;
            } else {
               totalOtherCharactersSelected++;
            }
         }
      });

      this.mainCharacterTotalPill.innerText = totalMainCharactersSelected;
      this.otherCharacterTotalPill.innerText = totalOtherCharactersSelected;
      this.tooltipInfoBadge.innerText =
         totalMainCharactersSelected + totalOtherCharactersSelected;
   }
}
