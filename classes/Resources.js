const puppeteer = require('puppeteer')
const ResourceConstants = require('../models/resourceConstants')

class Resources{

    constructor() {
    }

    async updatePetrolPrice () {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto('https://psopk.com/en/product-and-services/product-prices/pol')

        const [el] = await page.$x('/html/body/div[2]/div[4]/div/div/div/div[2]/div/div[1]/table/tbody/tr[2]/td[2]')
        const src = await el.getProperty('textContent')
        const srcText = await src.jsonValue()
        await ResourceConstants.updateOne( { resourceName : 'petrolPrice'}, {resourceName: 'petrolPrice', value : srcText, updatedAt: new Date() }, { upsert : true })
    }

    async getPetrolPrices () {
        const price = await ResourceConstants.findOne({ resourceName: 'petrolPrice' }, 'value').exec();
        return parseFloat(price.value)
    }
}

module.exports = Resources
