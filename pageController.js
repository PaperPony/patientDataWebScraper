const pageScraper = require('./pageScraper');
const ObjectsToCsv = require('objects-to-csv');
async function scrapeAll(browserInstance){
	let browser;
	try{
        // Open browser instance and scrape data
		browser = await browserInstance;
        let scrapedData = await pageScraper.scraper(browser);
        await browser.close();

        // Write the data to the patient file
        const csv = new ObjectsToCsv(scrapedData);
        try {
            await csv.toDisk('./patientData.csv');
            console.log("Successfully wrote data to file!");
        } catch (err) {
            console.log("Could not write the data to the file => ", err);
        }
        

	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance)
