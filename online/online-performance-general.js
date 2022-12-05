const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const { Parser } = require('json2csv');
const prompt = require('prompt-sync')
const fs = require('fs');


const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const request = require('request');
const util = require('util');


/**
 *
 * Perform a Lighthouse run
 * @param {String} url - url The URL to test
 * @param {Object} options - Optional settings for the Lighthouse run
 * @param {Object} [config=null] - Configuration for the Lighthouse run. If
 * not present, the default config is used.
 */
async function lighthouseFromPuppeteer(chrome, url, options, config = null) {
  // Launch chrome using chrome-launcher
  options.port = chrome.port;

  // Connect chrome-launcher to puppeteer
  const resp = await util.promisify(request)(`http://localhost:${options.port}/json/version`);
  const {webSocketDebuggerUrl} = JSON.parse(resp.body);
  const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});

  // Run Lighthouse
  const {lhr} = await lighthouse(url, options, config);
  await browser.disconnect();

  const json = reportGenerator.generateReport(lhr, 'json');

  const audits = JSON.parse(json).audits; // Lighthouse audits
  const firstContentfulPaint = audits['first-contentful-paint'].displayValue;
  const totalBlockingTime = audits['total-blocking-time'].displayValue;
  const timeToInteractive = audits['interactive'].displayValue;
  const speedIndex = audits['speed-index'].displayValue;
  const largestContentfulPaint = audits['largest-contentful-paint'].displayValue;
  const cumulativeLayoutShift = audits['cumulative-layout-shift'].displayValue;

  console.log(`\n
     Lighthouse metrics: 
     🎨 Cumulative Layout Shift: ${cumulativeLayoutShift}, 
     🎨 Largest Contentful Paint: ${largestContentfulPaint}, 
     🎨 Speed Index: ${speedIndex}, 
     🎨 First Contentful Paint: ${firstContentfulPaint}, 
     ⌛️ Total Blocking Time: ${totalBlockingTime},
     👆 Time To Interactive: ${timeToInteractive}`);

     const resultsObject = {
        firstContentfulPaint,
        largestContentfulPaint,
        totalBlockingTime,
        timeToInteractive,
        speedIndex,
        cumulativeLayoutShift
     };

     return resultsObject;
   
}


async function printCSV(chrome, url, options, file) {


    let results = []
    for(let i = 0; i < 10; i++){
        const result = await lighthouseFromPuppeteer(chrome, url, options);
        results.push(result)
    }

    const fields = Object.keys(results[0])
    const opts = { fields };

    try {
        const parser = new Parser(opts);
        const csv = parser.parse(results);
        console.log(`CSV DATA FOR ${file}`)
        console.log(csv);
        fs.writeFile(`./reports/general/${file}.csv`, csv, function(err) {
            if (err) throw err;
          });
  
    } catch (err) {
        console.error(err);
    }
}

async function generateShipmentsReports(url) {
  const options = {
    logLevel: 'info',
    disableDeviceEmulation: true,
    disableStorageReset: true,
    chromeFlags: ['--disable-mobile-emulation'],
  };

  const optionsWithoutCaching = {
    logLevel: 'info',
    disableDeviceEmulation: true,
    chromeFlags: ['--disable-mobile-emulation'],
  };


    const chrome = await chromeLauncher.launch(options);
    var n = prompt()("Navigate to website, and enter credentials. Then hit enter! ")

    //http://localhost:3000/#/detail/102984147
    //const websiteUrl = "http://localhost:3000/#/detail/102984147";
    const websiteUrl = "https://dev-online.chrobinson.com/shipments/#/detail/102984147";

    await printCSV(chrome, websiteUrl, options, 'dev-shipments-poc-hosted');

    chrome.kill();
}

generateShipmentsReports();
