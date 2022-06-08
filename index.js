const browserObject = require('./browser');
const scraperController = require('./pageController');

let browserInstance = browserObject.startBrowser(); // browser instance

scraperController(browserInstance) // start scraping