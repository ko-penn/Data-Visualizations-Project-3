/**
 * Run this file to scrape all the text transcripts from the https://www.livesinabox.com/friends/scripts.shtml site
 * Can run this with node doing `node <path to scrapper.js file>`
 */

const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
   // Launch the browser and open a new blank page
   const browser = await puppeteer.launch({ headless: false });
   const page = await browser.newPage();

   // Navigate the page to a URL
   await page.goto('https://www.livesinabox.com/friends/scripts.shtml');

   // Set screen size
   await page.setViewport({ width: 1080, height: 1024 });

   // Wait for first link
   const tableElement = await page.waitForSelector(
      'body > table > tbody > tr > td > table:nth-child(3) > tbody > tr > td > table > tbody > tr > td:nth-child(2) > table'
   );

   let episodes = await tableElement?.evaluate((el) => {
      const elms = el.querySelectorAll('li a');
      return Array.from(elms).reduce((acc, elm) => {
         const innerText = elm.innerText;
         let [first, ...rest] = innerText.split(':');
         rest = rest.join(':');
         const title = rest.trim();

         const prefix = first.split(' ')[1];
         const seasonLength = (prefix?.length ?? 2) - 2;
         const season = +prefix?.slice(0, seasonLength);
         const episode = +prefix?.slice(seasonLength, prefix.length);

         const href = elm.getAttribute('href');
         if (season && episode) {
            acc.push({
               title,
               season,
               episode,
               href,
            });
         }
         return acc;
      }, []);
   });

   // TODO: remove this. it just reduces number of items we need to scrape
   // episodes = episodes.slice(0, 10);

   const transcriptPage = await browser.newPage();
   for (let i = 0; i < episodes.length; i++) {
      // Navigate the page to a URL
      await transcriptPage.goto(
         `https://www.livesinabox.com/friends/${episodes[i].href}`
      );

      const episode = episodes[i];

      const body = await transcriptPage.waitForSelector('body');
      episode.scenes = await body.evaluate((el) => {
         const scenes = [];
         let currScene = null;
         const elms = Array.from(el.querySelectorAll(':scope > p'));
         for (let j = 0; j < elms.length; j++) {
            const elm = elms[j];
            const innerText = elm.innerText;

            const excludedLines = [
               'Commercial Break',
               'End',
               'Closing Credits',
               'Opening Credits',
               'Opening Titles',
            ];
            if (
               excludedLines.some(
                  (l) => l.toLowerCase() === innerText.toLowerCase()
               )
            ) {
               continue;
            }

            if (innerText.startsWith('[Scene:')) {
               if (currScene) {
                  currScene.speakers = Array.from(currScene.speakers);
                  scenes.push(currScene);
               }
               currScene = {
                  scene: innerText,
                  speakers: new Set(),
                  lines: [],
               };
            } else if (
               !innerText.startsWith('[') &&
               !innerText.startsWith('(') &&
               !innerText.startsWith('{') &&
               currScene
            ) {
               let [speaker, ...line] = elm?.innerText?.trim().split(':') ?? [
                  null,
                  [],
               ];
               line = line.join(':').trim();
               if (speaker && elm?.innerText?.includes(':')) {
                  function toTitleCase(str) {
                     return str.replace(/\w\S*/g, function (txt) {
                        return (
                           txt.charAt(0).toUpperCase() +
                           txt.substr(1).toLowerCase()
                        );
                     });
                  }

                  speaker = toTitleCase(speaker);
                  currScene.speakers.add(speaker);
                  currScene.lines.push({
                     speaker,
                     line,
                  });
               }
            }
         }
         if (currScene) {
            currScene.speakers = Array.from(currScene.speakers);
            scenes.push(currScene);
         }

         return scenes;
      });

      episode.speakers = Array.from(
         new Set(episode.scenes.reduce((acc, s) => [...acc, ...s.speakers], []))
      );
   }
   await transcriptPage.close();
   fs.writeFileSync('../data/transcripts.json', JSON.stringify(episodes));

   await browser.close();
})();
