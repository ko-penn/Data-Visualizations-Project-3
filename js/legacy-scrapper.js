/**
 * This was the first attempt at creating a webscapper.
 * It had a few problems around not all episodes getting there scenes parsed properly
 * because of inconsistencies between source pages.
 * See scrapper.js file for the more complete version of this logic
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
   // episodes = episodes.slice(0, 1);

   const transcriptPage = await browser.newPage();
   for (let i = 0; i < episodes.length; i++) {
      // Navigate the page to a URL
      await transcriptPage.goto(
         `https://www.livesinabox.com/friends/${episodes[i].href}`
      );

      let source = await transcriptPage.content({
         waitUntil: 'domcontentloaded',
      });
      fs.writeFileSync(
         `../data/files/${episodes[i].season}-${episodes[i].episode}.html`,
         source
      );

      const episode = episodes[i];

      const body = await transcriptPage.waitForSelector('body');
      episode.scenes = await body.evaluate((body, episode) => {
         const scenes = [];
         let currScene = null;
         const scope =
            episode.season < 10
               ? ':scope'
               : 'table > tbody > tr > td > table:nth-child(3) > tbody > tr > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td';
         const elms = Array.from(body.querySelectorAll(`${scope} > p`));

         function toTitleCase(str) {
            return str.replace(/\w\S*/g, function (txt) {
               return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
         }

         function addCurrScene(innerText) {
            if (currScene) {
               const allSceneSpeakers = new Set();
               const speakersToFilterOut = [];
               currScene.lines.forEach((l) => {
                  allSceneSpeakers.add(...l.speakers);
               });

               currScene.lines = currScene.lines.map((l) => {
                  const quoteFrom = l.quoteFrom.toLowerCase();
                  if (
                     quoteFrom === 'all' ||
                     quoteFrom === 'everybody' ||
                     quoteFrom === 'everyone'
                  ) {
                     speakersToFilterOut.push(l.quoteFrom);
                     l.speakers = Array.from(allSceneSpeakers);
                  } else if (
                     quoteFrom === 'everyone almost simultaneously except ross'
                  ) {
                     speakersToFilterOut.push(l.quoteFrom);
                     l.speakers = Array.from(allSceneSpeakers).filter(
                        (f) => f.toLowerCase() !== 'ross'
                     );
                  }

                  if (l.quoteFrom.includes('(')) {
                     speakersToFilterOut.push(l.quoteFrom);
                     let [speaker, ...rest] = l.quoteFrom.split('(');
                     l.speakers = [toTitleCase(speaker.trim())];
                  } else if (l.quoteFrom.includes('[')) {
                     speakersToFilterOut.push(l.quoteFrom);
                     let [speaker, ...rest] = l.quoteFrom.split('[');
                     l.speakers = [toTitleCase(speaker.trim())];
                  }

                  l.speakers = Array.from(l.speakers);
                  return l;
               });

               currScene.lines = currScene.lines.map((l) => {
                  l.speakers = Array.from(l.speakers).filter(
                     (s) =>
                        s &&
                        !speakersToFilterOut.some(
                           (s1) => s1.toLowerCase() === s.toLowerCase()
                        )
                  );
                  return l;
               });

               currScene.speakers = Array.from(
                  new Set(
                     currScene.lines.reduce((acc, l) => {
                        acc.push(...l.speakers);
                        return acc;
                     }, [])
                  )
               );
               scenes.push(currScene);
            }
            currScene = {
               scene: innerText,
               speakers: new Set(),
               lines: [],
            };
         }

         let innerText = null;
         for (let j = 0; j < elms.length; j++) {
            const elm = elms[j];
            innerText = elm.innerText.trim();

            const excludedLines = [
               'Commercial Break',
               'End',
               'Closing Credits',
               'Opening Credits',
               'Opening Titles',
               'This Is Only To Be Put Up On Friends - Greatest Sitcom',
               'Copyright Issues',
            ];
            if (
               excludedLines.some((l) =>
                  innerText.toLowerCase().includes(l.toLowerCase())
               )
            ) {
               continue;
            }

            if (innerText.startsWith('[Scene:')) {
               addCurrScene(innerText);
            } else if (
               !innerText.startsWith('[') &&
               !innerText.startsWith('(') &&
               !innerText.startsWith('{') &&
               currScene
            ) {
               let [quoteFrom, ...line] = elm?.innerText?.trim().split(':') ?? [
                  null,
                  [],
               ];
               line = line.join(':').trim();
               if (quoteFrom && elm?.innerText?.includes(':')) {
                  const delimiter = '<>';
                  const speakers = quoteFrom
                     .toLowerCase()
                     .split('/')
                     .join(delimiter)
                     .split(' and ')
                     .join(delimiter)
                     .split('&')
                     .join(delimiter)
                     .split(',')
                     .join(delimiter)
                     .split('<">')
                     .join(delimiter)
                     .split(delimiter)
                     .map((s) => toTitleCase(s.trim()));

                  currScene.lines.push({ speakers, quoteFrom, line });
               }
            }
         }
         addCurrScene(innerText);

         return scenes;
      }, episode);

      episode.speakers = Array.from(
         new Set(episode.scenes.reduce((acc, s) => [...acc, ...s.speakers], []))
      );
   }
   await transcriptPage.close();
   fs.writeFileSync('../data/transcripts.json', JSON.stringify(episodes));

   await browser.close();
})();
