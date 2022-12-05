/* eslint-disable spaced-comment */
/* eslint-disable space-before-blocks */
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')
const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const request = require('request');
const util = require('util');

const options = {
  logLevel: 'info',
  disableDeviceEmulation: true,
  chromeFlags: ['--disable-mobile-emulation'],
};

/**
 *
 * Perform a Lighthouse run
 * @param {String} url - url The URL to test
 * @param {Object} options - Optional settings for the Lighthouse run
 * @param {Object} [config=null] - Configuration for the Lighthouse run. If
 * not present, the default config is used.
 */



// eslint-disable-next-line require-jsdoc
async function getLigthouseMetricsArray(url, numberOfTests) {
      //await lighthouseFromPuppeteer('https://bbc.com', options);
      
        // Launch chrome using chrome-launcher
    const chrome = await chromeLauncher.launch(options);

    var n = prompt()("Navigate to website, and enter credentials. Then hit enter! ");
    options.port = chrome.port;

    // Connect chrome-launcher to puppeteer
    const resp = await util.promisify(request)(`http://localhost:${options.port}/json/version`);
    const {webSocketDebuggerUrl} = JSON.parse(resp.body);
    //const webSocketDebuggerUrl = "ws://127.0.0.1:9222/devtools/browser/f1ad2569-6c59-4aeb-ac38-ae4e4b61a1d4";
    const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});

    console.log(browser);

    var res = [];

    for(var i=0; i<numberOfTests; i++){
      const metrics = await getLighthouseMetrics(url);
      res.push(metrics);
    }
     
    await browser.disconnect();
    await chrome.kill();
    return res;
}

function logMetrics(x){
    console.log(`\n
      Lighthouse metrics: 
      🎨 First Contentful Paint: ${x.firstContentfulPaint}, 
      ⌛️ Total Blocking Time: ${x.totalBlockingTime},
      Largest contentful paint: ${x.largestContentfulPaint},
      👆 Time To Interactive: ${x.timeToInteractive}`);
}

async function getLighthouseMetrics(url){
    const {lhr} = await lighthouse(url, options, null);
    const json = reportGenerator.generateReport(lhr, 'json');
    const audits = JSON.parse(json).audits; // Lighthouse audits
    const firstContentfulPaint = audits['first-contentful-paint'].displayValue;
    const totalBlockingTime = audits['total-blocking-time'].displayValue;
    const timeToInteractive = audits['interactive'].displayValue;
    const largestContentfulPaint = audits['largest-contentful-paint'].displayValue;

    return {firstContentfulPaint, totalBlockingTime, timeToInteractive, largestContentfulPaint};
}


const numberOfTests = 10;
  const url = "https://www.bbc.com/news";
getLigthouseMetricsArray(url, numberOfTests)
.then( metrics => {
  for(var i=0; i<numberOfTests; i++)
  {
    logMetrics(metrics[i]);
  }
});



