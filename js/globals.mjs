// ---------- Data variables ----------

import { Chord } from './charts/chord.js';
import { Episodes } from './charts/episodes.js';
import { Stacked } from './charts/stacked.js';
import { WordCloud } from './charts/word-cloud.js';
import { Words } from './charts/words.js';
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
 * @type {(Episodes | null)}
 * Object for episodes line chart instance
 */
globalThis.episodesLine = null;
/**
 * @type {(Words | null)}
 * Object for words line chart instance
 */
globalThis.wordsLine = null;
/**
 * @type {(Stacked | null)}
 * Object for words line chart instance
 */
globalThis.linesStacked = null;
/**
 * @type {(Chord | null)}
 * Object for chord chart instance
 */
globalThis.scenesChord = null;
/**
 * @type {(Chord | null)}
 * Object for chord chart instance
 */
globalThis.episodesChord = null;
/**
 * @type {({[x: string]: WordCloud})}
 * Object for chord chart instance
 */
globalThis.wordClouds = {};

/**
 * Updates all global instances of all visualizations
 */
globalThis.updateAllVis = (dataChange) => {
   if (dataChange) {
      Object.entries(wordClouds).forEach(([character, instance]) =>
         instance?.updateData(data)
      );
      episodesLine?.updateData(data);
      wordsLine?.updateData(data);
      linesStacked?.updateData(data);
      scenesChord?.updateData(data);
      episodesChord?.updateData(data);
   } else {
      Object.entries(wordClouds)?.forEach(([character, instance]) =>
         instance?.updateVis()
      );
      episodesLine?.updateVis();
      wordsLine?.updateVis();
      linesStacked?.updateVis();
      scenesChord?.updateVis();
      episodesChord?.updateVis();
   }
};

/**
 * Handles refiltering processed data on a global filter change
 */
const debouncePromise = (fn, ms = 0) => {
   let timeoutId;
   const pending = [];
   return (...args) =>
      new Promise((res, rej) => {
         clearTimeout(timeoutId);
         timeoutId = setTimeout(() => {
            const currentPending = [...pending];
            pending.length = 0;
            Promise.resolve(fn.apply(this, args)).then(
               (data) => {
                  currentPending.forEach(({ resolve }) => resolve(data));
               },
               (error) => {
                  currentPending.forEach(({ reject }) => reject(error));
               }
            );
         }, ms);
         pending.push({ resolve: res, reject: rej });
      });
};
const handleGlobalFilterChangeFunction = (forceDataChange = false) =>
   new Promise((resolve) => {
      const preData = [...data];

      const selectedCharacters = new Set(
         characterFormBuilder.checkboxs
            .filter((c) => c.checked)
            .map((c) => c.getAttribute('data-character'))
      );
      Object.keys(wordClouds).forEach((k) => {
         if (!selectedCharacters.has(k)) {
            wordClouds[k]?.destroy();
         }
      });
      Array.from(selectedCharacters).forEach((character) => {
         if (!wordClouds[character]) {
            wordClouds[character] = new WordCloud(
               {
                  parentElementSelector: '#character-word-cloud-container',
                  id: character + '-word-cloud',
               },
               character
            );
         }
      });

      data = Object.keys(processedData)
         .filter((key) => {
            if (
               episodeFormBuilder.treeItems.some(
                  (c) => c.getAttribute('data-key') === key && c.selected
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
                  Array.from(selectedCharacters).some((c) =>
                     l.speakers.some(
                        (speaker) => speaker.toLowerCase() === c.toLowerCase()
                     )
                  )
               );
               return s;
            });
            return d;
         });
      updateAllVis(
         JSON.stringify(data) !== JSON.stringify(preData) || forceDataChange
      );
      resolve();
   });
globalThis.handleGlobalFilterChange = debouncePromise(
   handleGlobalFilterChangeFunction,
   50
);
