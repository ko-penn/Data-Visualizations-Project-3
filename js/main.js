import { Chord } from './charts/chord.js';
import { Episodes } from './charts/episodes.js';
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
   });
   wordsLine = new Words({
      parentElementSelector: '#words-line-container',
      id: 'words-line',
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
