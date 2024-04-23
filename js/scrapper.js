/**
 * Run this file to scrape all the text transcripts from the https://www.livesinabox.com/friends/scripts.shtml site
 * Can run this with node doing `node <path to scrapper.js file>`
 */

const fs = require('fs');
const puppeteer = require('puppeteer');

/**
 * Denotes whether we should download the html files frm the scrapped sites.
 * Should only have to do this once but resetting the html files may be useful thus the flag
 */
const downloadHtmlFiles = false;

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

	const transcriptPage = await browser.newPage();
	if (downloadHtmlFiles) {
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
		}
	}

	for (let i = 0; i < episodes.length; i++) {
		const contentHtml = fs.readFileSync(
			`../data/files/${episodes[i].season}-${episodes[i].episode}.html`,
			'utf8'
		);

		await transcriptPage.setContent(contentHtml);

		const episode = episodes[i];
		const body = await transcriptPage.waitForSelector('body');
		episode.scenes = await parseScenes(body, episode);
		episode.speakers = Array.from(
			new Set(episode.scenes.reduce((acc, s) => [...acc, ...s.speakers], []))
		);
	}

	fs.writeFileSync('../data/transcripts.json', JSON.stringify(episodes));
	await transcriptPage.close();

	await browser.close();
})();

async function parseScenes(body, episode) {
	return body.evaluate((body, episode) => {
		const scenes = [];
		let bodyTextLines = Array.from(body.querySelectorAll('p'))
			.map((p) => p.innerText.trim())
			.reduce((acc, curr) => {
				const lines = curr.split('\n');
				if (lines.includes('\n') && lines.some((l) => l.includes(':'))) {
					acc.push(...lines);
				} else {
					acc.push(curr);
				}

				return acc;
			}, []);

		const inconsistentHtmlFileKeys = [
			'2-9',
			'2-12',
			'2-14',
			'2-15',
			'2-16',
			'2-17',
			'2-18',
			'2-19',
			'2-20',
			'2-21',
			'2-22',
			'2-23',
			'2-24',
			'9-7',
			'9-11',
			'9-15',
		];

		if (
			inconsistentHtmlFileKeys.some(
				(k) => k === `${episode.season}-${episode.episode}`
			)
		) {
			bodyTextLines = body.innerText.split('\n').map((p) => p.trim());
		}

		let currScene = null;

		function toTitleCase(str) {
			return str.replace(/\w\S*/g, function (txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		}

		function addCurrScene(scene) {
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
				scene,
				speakers: new Set(),
				lines: [],
			};
		}

		for (let bodyTextLine of bodyTextLines) {
			/**
			 * Covers some edge cases where inconsistencies between scraped html files cause incorrect character parsing
			 */
			const excludedSpeakers = [
				'Commercial',
				'Commercial Break',
				'Credits',
				'End',
				'Closing Credits',
				'Opening Credits',
				'Opening Titles',
				'This Is Only To Be Put Up On Friends - Greatest Sitcom',
				'Copyright Issues',
				"{Transcriber's Note",
				'{Transcriber’s Note',
				'{Transciber’s Note',
				'Offer With A Pen)',
				'To Dance. Without Turning Around',
				'In This Case',
				"She's Entitled To Be A Little Paranoid... Or",
				'P.s.',
				'Note 1',
				'So Try To Keep Uphoebe',
				'This Is Gonna Be Fast',
				'Cried Out',
				'Tucked His ??? Between His Legs',
				'Off All His Clothes',
				"Now, I Can't Remember Why.",
				'Towards Heross',
				'Next To Chandler Starts Smoking',
				'Us Has To Stay Home And Watch Emma.',
				'Cut To',
				'{Note',
				'But She Sees Ross',
				'But Not In A Gross Way. Just Kind Of Like',
			];

			if (
				bodyTextLine.startsWith('[') ||
				bodyTextLine.startsWith('Scene:')
			) {
				addCurrScene(bodyTextLine);
			} else if (currScene && bodyTextLine.includes(':')) {
				let [quoteFrom, ...line] = bodyTextLine.split(':') ?? [null, []];
				quoteFrom = quoteFrom.trim();
				line = line.join(':').trim();

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

				if (
					speakers.some((s) =>
						excludedSpeakers.some((es) =>
							s.toLowerCase().trim().includes(es.toLowerCase().trim())
						)
					)
				) {
					continue;
				}

				currScene.lines.push({ speakers, quoteFrom, line });
			}
		}
		addCurrScene();

		return scenes;
	}, episode);
}
