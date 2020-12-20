const express = require('express');
const router = express.Router();
const axios = require('axios')
const Route = require('../classes/Route')
const Plan = require('../classes/Plan')
const Hotel = require('../classes/hotel')
const demo = require('../demo/demo')
const Interests = require('../classes/Interests')
const HotelSearch = require('../classes/Hotel')
const Resources = require('../classes/Resources')
const Tour = require('../models/tour')

const _averageRatings = (ratings) => {
    let sum = 0
    ratings.forEach((rating)=>{
        sum+=rating.stars
    })
    return (sum/ratings.length).toFixed(1)
}

router.get('/generatetour', async(req, res)=>{
    const {coordinates, dates, budget, hobbies, fuelAverage, fuelType, guests} = req.query
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
        const fuelPrice = await resources.getFuelPrices(fuelType)
        const expenditureOnFuel = ((tourWithDistances.totalTourDistance/1000)/fuelAverage) * fuelPrice
        const expenditureForHotelStays = budget - expenditureOnFuel

        const totalHotelStaysDuration = tourWithDistances.tour.route.reduce((a, b) => a + (b.stayDuration || 0), 0);
        const totalHotelStaysWeights = tourWithDistances.tour.route.map(routeLocation=>routeLocation.stayDuration/totalHotelStaysDuration)

        // Add bookings to the tour
        let tourWithBookings = tourWithDistances
        for(const [index, stayLocation] of tourWithDistances.tour.route.entries()){
            if(stayLocation.stayDuration>0){
                const checkInDate = dates[stayLocation.tourDays[0]-1]
                const checkOutDate = dates[stayLocation.tourDays[stayLocation.tourDays.length-1]-1]
                const hotels = new HotelSearch(
                    parseFloat(stayLocation.geometry.coordinates.lat),
                    parseFloat(stayLocation.geometry.coordinates.lng),
                    checkInDate,
                    checkOutDate
                )
                const budgetForThisStayPerRoomPerDay = (expenditureForHotelStays*totalHotelStaysWeights[index])/stayLocation.stayDuration
                let results = []
                if(expenditureOnFuel<0){
                    results = await hotels.getCheapestRoomOptions(10000, parseInt(guests))
                }
                else{
                    results = await hotels.getBestRoomOptions(parseInt(budgetForThisStayPerRoomPerDay), 10000, parseInt(guests))
                }
                const resultsWithTotals = []
                for(const [index, result] of results.entries()){
                    let total = 0
                    result.forEach((resultRoom)=>{
                        console.log(tourWithDistances.tour.route[index].stayDuration)
                        total+=resultRoom.price*stayLocation.stayDuration
                    })
                    const someHotel = new Hotel()
                    const hotelData = await someHotel.findHotelDetailsById(result[0].hotelid)
                    resultsWithTotals.push({
                        hotel: hotelData,
                        rooms: result,
                        total: total,
                        stayDuration: stayLocation.stayDuration
                    })
                }
                tourWithBookings = {...tourWithBookings, dateSchedule: {...tourWithBookings.dateSchedule, [checkInDate]: [{...tourWithBookings.dateSchedule[checkInDate][0], bookings: resultsWithTotals}]}}
            }
        }

        res.send(tourWithBookings)
        // setTimeout(function(){
        //     res.send(demo)
        // }, 12000);
    }
    catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})

router.get('/getmytours/:userId/:type', async(req, res) => {
    try{
        const {userId, type} = req.params
        const publishedTours = await Tour.find({'user.id': userId, public: type==='saved'?false:true}, '_id cities title description user dateSchedule ratings totalTourDistance')
        let publishedToursWithdays = []
        publishedTours.forEach((publishedTour)=>{
            const {_id, cities, title, description, user, dateSchedule, ratings, totalTourDistance} = publishedTour
            publishedToursWithdays.push({_id, cities, title, description, user, time: Object.keys(dateSchedule).length, ratings, totalTourDistance})
        })
        res.send(publishedToursWithdays)
    }
    catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})

router.get('/gettoursbyrating', async(req, res)=>{
    try{
        const tours = await Tour.find({public: true}, '_id cities title description user dateSchedule ratings averageRating totalTourDistance')
        const toursWithTime = []
        tours.forEach((tour)=>{
            const {_id, cities, title, description, user, dateSchedule, ratings, averageRating, totalTourDistance} = tour
            toursWithTime.push({_id, cities, title, description, user, time: Object.keys(dateSchedule).length, ratings, averageRating, totalTourDistance})
        })
        toursWithTime.sort(function(a, b){
            return _averageRatings(b.ratings) - _averageRatings(a.ratings)
        });
        res.send(toursWithTime)
    }
    catch(e){
        res.status(400).send()
    }
})

router.get('/gettoursnearme', async(req, res)=> {
    try{
        const lat = req.query.lat
        const lng = req.query.lng
        const tours = await Tour.find({public: true}, '_id cities title description user dateSchedule ratings averageRating totalTourDistance').getNearbyTours(lat, lng, 30000)
        tours.sort(function(a, b){
            return b.ratings.length - a.ratings.length
        });
        const toursWithTime = []
        tours.forEach((tour)=>{
            const {_id, cities, title, description, user, dateSchedule, ratings, averageRating, totalTourDistance} = tour
            toursWithTime.push({_id, cities, title, description, user, time: Object.keys(dateSchedule).length, ratings, averageRating, totalTourDistance})
        })
        res.send(toursWithTime)
    }
    catch (e){
        console.log(e)
        res.status(400).send()
    }
})

router.post('/rateTour/:tourId', async (req, res) => {
    const {tourId} = req.params
    const {rating} = req.body
    try{
        await Tour.update({_id: tourId},
            {
                $push: {
                    ratings: rating
                }
            }
        )
        res.status(200).send()
    }
    catch(e){
        res.status(400).send()
    }
})

router.post('/savetour', async (req, res) => {
    try{
        const lon = req.body.tour.route[0].geometry.coordinates.lng
        const lat = req.body.tour.route[0].geometry.coordinates.lat
        const tour = await Tour.create({...req.body, ratings: [], geometry: {coordinates: [lon, lat]}})
        res.send('ok')
    }
    catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})


module.exports = router;
