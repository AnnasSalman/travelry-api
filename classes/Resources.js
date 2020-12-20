const puppeteer = require('puppeteer')
const ResourceConstants = require('../models/resourceConstants')

class Resources{

    constructor() {
    }
    // /html/body/div[2]/div[4]/div/div/div/div[2]/div/div[1]/table/tbody/tr[3]/td[2]
    async updatePetrolPrice () {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto('https://psopk.com/en/product-and-services/product-prices/pol')

        const [el] = await page.$x('/html/body/div[2]/div[4]/div/div/div/div[2]/div/div[1]/table/tbody/tr[2]/td[2]')
        const src = await el.getProperty('textContent')
        const srcText = await src.jsonValue()

        const [el2] = await page.$x('/html/body/div[2]/div[4]/div/div/div/div[2]/div/div[1]/table/tbody/tr[3]/td[2]')
        const src2 = await el2.getProperty('textContent')
        const srcText2 = await src2.jsonValue()

        await ResourceConstants.updateOne( { resourceName : 'petrolPrice'}, {resourceName: 'petrolPrice', value : srcText, updatedAt: new Date() }, { upsert : true })
        await ResourceConstants.updateOne( { resourceName : 'dieselPrice'}, {resourceName: 'dieselPrice', value : srcText2, updatedAt: new Date() }, { upsert : true })

        await browser.close()
    }


    async getFuelPrices (fuelType) {
        if(fuelType==='diesel'){
            const price = await ResourceConstants.findOne({ resourceName: 'petrolPrice' }, 'value').exec();
            return parseFloat(price.value);
        }
        else {
            const price = await ResourceConstants.findOne({ resourceName: 'dieselPrice' }, 'value').exec();
            return parseFloat(price.value)
        }
    }
}

module.exports = Resources
