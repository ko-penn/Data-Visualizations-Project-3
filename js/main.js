import { Chord } from './charts/chord.js';
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

   console.log(rawData.filter((d) => !d.speakers.some((s) => s === 'Ross')));

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
