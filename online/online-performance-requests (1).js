const puppeteer = require('puppeteer');
const { Parser } = require('json2csv');
const prompt = require('prompt-sync')
const fs = require('fs');


const perfObsRunner = () => {
    window.resourceList = [];
    new PerformanceObserver((list) => {
      list.getEntries().forEach((item) => {
        window.resourceList = [...window.resourceList, item.toJSON()]
      })
    }).observe({type: 'resource', buffered: true});
  }
  
  

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
async function lighthouseFromPuppeteer(browser, url, options, config = null) {
    const page = await browser.newPage();

     await page.evaluateOnNewDocument(perfObsRunner);
     await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
     const resourcesObject = await page.evaluate(() => ({ resource: window.resourceList }));

     const resources = resourcesObject.resource;


     let resultsObject = {};

     for(const resource of resources) {
        resultsObject[`${resource.name}-startTime`] = resource.startTime;
        resultsObject[`${resource.name}-duration`] = resource.duration;
     }

     return resultsObject;
   
}


async function printCSV(browser, url, options, file) {

    let results = []
    for(let i = 0; i < 10; i++){
        const result = await lighthouseFromPuppeteer(browser, url, options);
        results.push(result)
    }

    const fields = Object.keys(results[0])
    const opts = { fields };

    try {
        const parser = new Parser(opts);
        const csv = parser.parse(results);
        fs.writeFile(`./reports/network-requests/${file}.csv`, csv, function(err) {
          if (err) throw err;
        });
        } catch (err) {
        console.error(err);
    }
}

async function generateShipmentsReports() {
  const browser = await puppeteer.launch({ headless: false });
  var n = prompt()("Navigate to website, and enter credentials. Then hit enter! ")

  await printCSV(browser, 'http://localhost:3000/#/detail/102984147', options, 'shipments-poc-gzip-local');
  await printCSV(browser, 'https://dev-online.chrobinson.com/shipments-poc/#/detail/102984147', options, 'shipments-poc');
  await printCSV(browser, 'https://dev-online.chrobinson.com/shipments/#/detail/102984147', options, 'shipments');

  browser.close();
} 

generateShipmentsReports();