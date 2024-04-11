// ---------- Data variables ----------

import { CharacterFormBuilder } from './helpers/character-form-builder.js';
import { EpisodeFormBuilder } from './helpers/episode-form-builder.js';

/**
 * The raw data retrieved from reading the csv
 */
globalThis.rawData = [];

/**
 * The processed raw data.
 * This should have the correct type castings and extra calculated fields built from rawData.
 * Its also what is used to build the data object with the correct filtering, grouping, etc...
 */
globalThis.processedData = {};

globalThis.processDataKeyBuilder = (d) => `${d.season}-${d.episode}`;
globalThis.processDataKeyParser = (key) => {
   const [season, episode] = key.split('-');
   return { season, episode };
};

/**
 * The processed, filtered, and aggregated processedData.
 */
globalThis.data = [];

/**
 * @type {(EpisodeFormBuilder | null)}
 * Object for form builder instance
 */
globalThis.episodeFormBuilder = null;
/**
 * @type {(CharacterFormBuilder | null)}
 * Object for form builder instance
 */
globalThis.characterFormBuilder = null;

/**
 * Updates all global instances of all visualizations
 */
globalThis.updateAllVis = (dataChange) => {
   if (dataChange) {
      // wordCloud?.updateData(data);
   } else {
      // wordCloud?.updateVis();
   }
};

/**
 * Handles refiltering processed data on a global filter change
 */
let globalFilterChangeTimeout = null;
globalThis.handleGlobalFilterChange = () => {
   // Debounce globalFilterChanges so repeat calls done refilter data erroneously
   if (globalFilterChangeTimeout) clearTimeout(globalFilterChangeTimeout);

   const debounceTimeInMS = 50;
   globalFilterChangeTimeout = setTimeout(() => {
      const preData = [...data];
      data = Object.keys(processedData)
         .filter((key) => {
            if (
               episodeFormBuilder.checkboxs.some(
                  (c) => c.getAttribute('data-key') === key && c.checked
               )
            ) {
               return true;
            }

            return false;
         })
         .map((key) => {
            const d = processedData[key];
            d.scenes = d.scenes.map((s) => {
               s.lines = s.lines.filter((l) =>
                  characterFormBuilder.checkboxs
                     .filter((c) => c.checked)
                     .some((c) =>
                        l.speakers.some(
                           (speaker) =>
                              speaker.toLowerCase() ===
                              c.getAttribute('data-character').toLowerCase()
                        )
                     )
               );
               return s;
            });
            return d;
         });

      updateAllVis(JSON.stringify(data) !== JSON.stringify(preData));
   }, debounceTimeInMS);
};
