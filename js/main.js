import { Chord } from './charts/chord.js';
import { Episodes } from './charts/episodes.js';
import { Stacked } from './charts/stacked.js';
import { WordCloud } from './charts/word-cloud.js';
import { Words } from './charts/words.js';
import { CharacterFormBuilder } from './helpers/character-form-builder.js';
import { EpisodeFormBuilder } from './helpers/episode-form-builder.js';

document.addEventListener('DOMContentLoaded', () => {
   main();
});

async function main() {
   try {
      rawData = await d3.json('data/transcripts.json');
      processData();
   } catch (e) {
      console.error('Please run scrapper', e);
   }

   episodeFormBuilder = new EpisodeFormBuilder();
   characterFormBuilder = new CharacterFormBuilder();

   episodesLine = new Episodes({
      parentElementSelector: '#episodes-line-container',
      id: 'episodes-line',
      groupingKey: 'scene',
   });
   wordsLine = new Words({
      parentElementSelector: '#words-line-container',
      id: 'words-line',
      groupingKey: 'scene',
   });
   linesStacked = new Stacked({
      parentElementSelector: '#stacked-lines-container',
      id: 'stacked-lines',
      groupingKey: 'scene',
   });
   scenesChord = new Chord({
      parentElementSelector: '#scenes-chord-container',
      id: 'scene-chord',
      groupingKey: 'scene',
   });
   episodesChord = new Chord({
      parentElementSelector: '#episodes-chord-container',
      id: 'episode-chord',
      groupingKey: 'episode',
   });

   initializeCharacterWordClouds();

   await handleGlobalFilterChange();

   const splitPanel = document.getElementById('split-panel');
   splitPanel.addEventListener('sl-reposition', () => {
      updateAllVis();
   });

   const tabGroup = document.getElementById('tab-group');
   tabGroup.addEventListener('sl-tab-show', async () => {
      await handleGlobalFilterChange();
   });
}

function processData() {
   processedData = {};

   rawData.forEach((d) => {
      const key = processDataKeyBuilder(d);
      processedData[key] = d;
   });
}

function initializeCharacterWordClouds() {
   Array.from(
      new Set(
         characterFormBuilder.checkboxs
            .filter((c) => c.checked)
            .map((c) => c.getAttribute('data-character'))
      )
   ).forEach((character) => {
      wordClouds[character] = new WordCloud(
         {
            parentElementSelector: '#character-word-cloud-container',
            id: character + '-word-cloud',
         },
         character
      );
   });
}
