const scraperObject = {
	url: 'https://ehr.doctorWebsite.com/',
	async scraper(browser){
        // Login info
        const email = 'drJohnDoe@doctorsCorporated.com';
        const password = 'oneTerriblePassword';

		// Navigate to the page
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		await page.goto(this.url);

        // Login Navigation
        const navigationPromise = page.waitForNavigation({waitUntil: 'networkidle0'});
        await page.waitForSelector('#external-account');
		await page.click('#external-account');

        // Email
        await page.waitForSelector('#i0116');
        await page.type('#i0116', email);
        await page.waitForSelector('#idSIButton9');
        await page.click('#idSIButton9');
        await navigationPromise;

        // Password
        await page.waitForSelector('#i0118');
        await page.type('#i0118', password);
        await page.waitForSelector('#idSIButton9');
        await page.click('#idSIButton9');
        await navigationPromise;
        await page.waitForSelector('#idBtn_Back');
        await page.click('#idBtn_Back');
        await navigationPromise;

        // Navigate to list page
        await page.waitForSelector('.select__value-container');
        let selectors = await page.$$('.select__value-container');
        await selectors[0].click();
        selectors = await page.$$('.select__option');
        await selectors[2].click();
        await navigationPromise;
        await page.waitForSelector('#app > nav > div.navbar-menu > div.navbar-start > a:nth-child(2)');
        await page.click('#app > nav > div.navbar-menu > div.navbar-start > a:nth-child(2)');
        await navigationPromise;
        await page.waitForSelector('#patient-active');
        await page.click('#patient-active');
        await navigationPromise;
        console.log("Arrived at patient list");
        
        // Select doctor / nurse practitioner
        await page.waitForSelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-header > div > div.level-left > div:nth-child(1) > div > div > div > div');
        await page.click('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-header > div > div.level-left > div:nth-child(1) > div > div > div > div');
        await page.waitForSelector('#react-select-5-option-0');
        await page.click('#react-select-5-option-0');

        // Get the total patient count
        await page.waitForSelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-header > div > div.level-right > p');

        let patientString =  await page.evaluate(() => {
            let selector = document.querySelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-header > div > div.level-right > p');
            return selector.innerText;
        });

        let patientTotal = patientString.split('of')[1].trim();
        patientTotal = parseInt(patientTotal);

        // Scroll down to the bottom of the form in order to fetch all the patients
        while(true){
            // Get the current patient count
            await page.waitForSelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-header > div > div.level-right > p');

            patientString =  await page.evaluate(() => {
                let selector = document.querySelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-header > div > div.level-right > p');
                return selector.innerText;
            });

            let patientCurrent = parseInt(patientString);
            if (patientCurrent === patientTotal) break;

            // Scroll down to the bottom of the form
            while(true) {
                await page.waitForSelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body');
                let fetchingPatients = await page.evaluate(() => {
                    let selector = document.querySelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body');
                    selector.scrollTo(0, selector.scrollHeight);
                    selector = document.querySelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-header > div > div.level-right > p');
                    return selector.innerText;
                });
                if (fetchingPatients !== 'fetching patients...') break;
            }
            console.log(`Current patient count: ${patientCurrent}`);
        }

        console.log("Finished scrolling");

        // Scrape the data
        let scrapedData = [];
        await page.waitForSelector('#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body');

        // Loop through all the patients
        for(let index = 0; index < patientTotal; index++){
            let patientInfoObj = {};
            console.log(`Current patient ${index}`);
            await page.waitForSelector(`#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body > div:nth-child(${index+1}) > div > div > div > div > div.has-text-dark > div > div`);
            
            // Get the patient name
            patientInfoObj['Name'] = await page.evaluate(index => {
                let selector = document.querySelector(`#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body > div:nth-child(${index+1}) > div > div > div > div > div.has-text-dark > div > div`);
                if(selector.childElementCount > 1){ // If the patient is currently inactive
                    return selector.children[1].innerText;
                }
                else { // If the patient is currently active
                    return selector.children[0].innerText;
                }
            }, index);

            // Email
            patientInfoObj['Email'] = await page.evaluate((index) => {
                let selector = document.querySelector(`#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body > div:nth-child(${index+1}) > div > div > div > div > div.is-size-7.patient-info-content.has-text-light > div:nth-child(1) > div > div > span:nth-child(2)`);
                return selector.innerText;
            }, index);

            // Age
            patientInfoObj['Age'] = await page.evaluate((index) => {
                let selector = document.querySelector(`#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body > div:nth-child(${index+1}) > div > div > div > div > div.is-size-7.patient-info-content.has-text-light > span:nth-child(3)`);
                return selector.innerText;
            }, index);

            // Sex
            patientInfoObj['Sex'] = await page.evaluate((index) => {
                let selector = document.querySelector(`#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body > div:nth-child(${index+1}) > div > div > div > div > div.is-size-7.patient-info-content.has-text-light > span:nth-child(4)`);
                return selector.innerText;
            }, index);

            // Phone Number
            patientInfoObj['Phone Number'] = await page.evaluate((index) => {
                let selector = document.querySelector(`#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body > div:nth-child(${index+1}) > div > div > div > div > div.is-size-7.patient-info-content.has-text-light > div:nth-child(6) > div > div > span:nth-child(2)`);
                return selector.innerText;
            }, index);

            // Date of Birth
            patientInfoObj['Date Of Birth'] = await page.evaluate((index) => {
                let selector = document.querySelector(`#app > section > div > div > div > div > div.panel.is-hoverable > div.panel-body > div:nth-child(${index+1}) > div > div > div > div > div.is-size-7.patient-info-content.has-text-light > span:nth-child(8) > div > div > span:nth-child(2)`);
                return selector.innerText;
            }, index);

            scrapedData.push(patientInfoObj);
        }

        console.log("Data scraped successfully");
        return scrapedData;
    }
}

module.exports = scraperObject;
