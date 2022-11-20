/* eslint-disable spaced-comment */
/* eslint-disable space-before-blocks */
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');

const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const request = require('request');
const util = require('util');
const url = "https://bbc.com";

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
async function fun() {
      //await lighthouseFromPuppeteer('https://bbc.com', options);
      
        // Launch chrome using chrome-launcher
    const chrome = await chromeLauncher.launch(options);
    options.port = chrome.port;

    // Connect chrome-launcher to puppeteer
    const resp = await util.promisify(request)(`http://localhost:${options.port}/json/version`);
    const {webSocketDebuggerUrl} = JSON.parse(resp.body);
    const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});

    for(var i=0; i<10; i++){
      const metrics = await getLighthouseMetrics();
      logMetrics(metrics);
    }
     
    await browser.disconnect();
    await chrome.kill();
}

function logMetrics(x){
    console.log(`\n
      Lighthouse metrics: 
      🎨 First Contentful Paint: ${x.firstContentfulPaint}, 
      ⌛️ Total Blocking Time: ${x.totalBlockingTime},
      👆 Time To Interactive: ${x.timeToInteractive}`);
}

async function getLighthouseMetrics(){
    const {lhr} = await lighthouse(url, options, null);
    const json = reportGenerator.generateReport(lhr, 'json');

    const audits = JSON.parse(json).audits; // Lighthouse audits
    const firstContentfulPaint = audits['first-contentful-paint'].displayValue;
    const totalBlockingTime = audits['total-blocking-time'].displayValue;
    const timeToInteractive = audits['interactive'].displayValue;

    return {firstContentfulPaint, totalBlockingTime, timeToInteractive};
}

fun();
