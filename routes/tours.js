const express = require('express');
const router = express.Router();
const axios = require('axios')
const Route = require('../classes/Route')
const Plan = require('../classes/Plan')
const Booking = require('../models/booking')
const Hotel = require('../models/hotel')
const puppeteer = require('puppeteer')
const demo = require('../demo/demo')
const Interests = require('../classes/Interests')
const HotelSearch = require('../classes/Hotel')
const Resources = require('../classes/Resources')

router.get('/getfuelprice', async (req, res)=>{
    const scrapeFuelPrice = async(url) => {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto(url)

        const [el] = await page.$x('/html/body/div[2]/div[4]/div/div/div/div[2]/div/div[1]/table/tbody/tr[2]/td[2]')
        const src = await el.getProperty('textContent')
        const srcText = await src.jsonValue()
        return srcText
    }
    try{
        // const Hotelsearch = new HotelSearch()
        // const result = await Hotelsearch.searchHotel()
        // res.send(result)
        // const price = await scrapeFuelPrice('https://psopk.com/en/product-and-services/product-prices/pol')
        // res.send(price)
    }
    catch(e){
        res.status(200).send(e)
    }
})

router.get('/generatetour', async(req, res)=>{
    const {coordinates, dates, budget, hobbies, fuelAverage} = req.query
    let coordinateString = ''
    coordinates.forEach((coordinate)=>{
        coordinateString+=coordinate+'|'
    })
    const route = new Route(coordinateString)
    try{

        // GENERAL PLAN CREATION
        const shortestTrip = await route.calculateShortestTrip()
        const plan = new Plan(dates.length,15000, shortestTrip)
        const tour = await plan.generateTour()
        let dateSchedule = {}
        dates.forEach((date,index)=>{
            const temp = []
            tour.route.forEach((location)=>{
                if(location.tourDays.includes(index+1)){
                    temp.push(location)
                }
            })
            dateSchedule = {...dateSchedule, [date]: [{locationstoVisit: temp, index: index+1, date}]}
        })

        // PLACES TO VISIT DURING STAY
        const placesToVisit = tour.route
        // const placesToVisit = demo.tour.route
        // const dateSchedule = demo.dateSchedule
        const stays = []
        placesToVisit.forEach((place, index)=>{
            if (place.stayDuration > 1) {
                stays.push({index, place})
            }
        })
        console.log('Stays=='+ stays)
        for(const stay of stays){
            const tourInterests = new Interests(hobbies)
            const placesOfInterest = await tourInterests.getPlaceRecommendations(stay.place.geometry.coordinates)
            placesToVisit[stay.index].availablePlaces = placesOfInterest
            let selectedLocalLocationIndex = 0
            let tempFix = 0
            stay.place.tourDays.length>3?tempFix=2:tempFix=1
            for(let i = 1; i < stay.place.tourDays.length - tempFix; i++){
                dateSchedule[dates[stay.place.tourDays[i]]][0].localAvailableLocations = placesOfInterest
                dateSchedule[dates[stay.place.tourDays[i]]][0].localSelectedLocations = placesOfInterest[selectedLocalLocationIndex]
                selectedLocalLocationIndex+=1
            }
        }

        // TOUR DISTANCE CALCULATION
        let tourWithDistances = {tour: {route: placesToVisit}, dateSchedule}

        // Adding distance for all dates in DateSchedule (local trips + travels)
        for(const date of dates){
            if(tourWithDistances.dateSchedule[date][0].locationstoVisit.length>1){
                let distanceCovered = 0
                for(let i = 0; i<tourWithDistances.dateSchedule[date][0].locationstoVisit.length; i++){
                    distanceCovered = distanceCovered + tourWithDistances.dateSchedule[date][0].locationstoVisit[i].distance.value
                }
                tourWithDistances = {...tourWithDistances, dateSchedule: {...tourWithDistances.dateSchedule, [date]:[{...tourWithDistances.dateSchedule[date][0], distanceCovered}]}}
            }
            else{
                tourWithDistances = {...tourWithDistances, dateSchedule: {...tourWithDistances.dateSchedule, [date]:[{...tourWithDistances.dateSchedule[date][0], distanceCovered: 0}]}}
            }
            if(tourWithDistances.dateSchedule[date][0].localSelectedLocations){
                const sourceCoordinates = tourWithDistances.dateSchedule[date][0].locationstoVisit[0].geometry.coordinates
                const destinationCoordinates = tourWithDistances.dateSchedule[date][0].localSelectedLocations.geometry.location
                const tempCoordinates = new Route(sourceCoordinates.lat+','+sourceCoordinates.lng+'|'+destinationCoordinates.lat+','+destinationCoordinates.lng)
                const distance = await tempCoordinates.getDistance()
                tourWithDistances = {...tourWithDistances, dateSchedule: {...tourWithDistances.dateSchedule, [date]:[{...tourWithDistances.dateSchedule[date][0], localSelectedLocations: {...tourWithDistances.dateSchedule[date][0].localSelectedLocations, distanceCovered: distance*2}}]}}
            }
        }

        // Adding Total distance
        let totalTourDistance = 0
        dates.forEach((date)=>{
                totalTourDistance += tourWithDistances.dateSchedule[date][0].distanceCovered
                if (tourWithDistances.dateSchedule[date][0].localSelectedLocations) {
                    totalTourDistance += tourWithDistances.dateSchedule[date][0].localSelectedLocations.distanceCovered
                }
        })
        tourWithDistances = {...tourWithDistances, totalTourDistance}

        // Get fuel prices and calculate total tour expenditure on fuel (approx)
        const resources = new Resources()
        const fuelPrice = await resources.getPetrolPrices()
        const expenditureOnFuel = ((totalTourDistance/1000)/fuelAverage) * fuelPrice


        res.send(tourWithDistances)


    }
    catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})

module.exports = router;
