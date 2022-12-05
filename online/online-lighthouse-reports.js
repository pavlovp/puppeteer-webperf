const fs = require('fs');
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const prompt = require('prompt-sync')

const chromeLauncher = require('chrome-launcher');
const reportGenerator = require('lighthouse/report/generator/report-generator.js');
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
async function lighthouseFromPuppeteer(webSocketDebuggerUrl, url, file, options, config = null) {

  // Connect chrome-launcher to puppeteer
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
  });

  // Run Lighthouse
  const {lhr} = await lighthouse(url, options, config);
  await browser.disconnect();

  const html = reportGenerator.generateReport(lhr, 'html');
  fs.writeFile(`./reports/lighthouse/${file}.html`, html, function(err) {
    if (err) throw err;
  });
}

async function runLighthouse() {

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

  options.port = chrome.port;
  optionsWithoutCaching.port = chrome.port;

  const resp = await util.promisify(request)(`http://localhost:${options.port}/json/version`);
  const {webSocketDebuggerUrl} = JSON.parse(resp.body);

  var n = prompt()("Navigate to website, and enter credentials. Then hit enter! ")

  await lighthouseFromPuppeteer(webSocketDebuggerUrl, 'https://localhost:3000/#/detail/102984147', 'poc-shipments-local-https2', options);
  await lighthouseFromPuppeteer(webSocketDebuggerUrl, 'https://localhost:3000/#/detail/102984147', 'shipments-poc-local-https2-without-caching', optionsWithoutCaching);

  await chrome.kill();
}

runLighthouse();