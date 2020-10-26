const express = require('express');
const router = express.Router();
const axios = require('axios')
const Route = require('../classes/Route')
const Plan = require('../classes/Plan')
const Booking = require('../models/booking')
const Hotel = require('../models/hotel')

router.get('/generatetour', async(req, res)=>{
    const {coordinates, dates, budget, hobbies} = req.query
    let coordinateString = ''
    coordinates.forEach((coordinate)=>{
        coordinateString+=coordinate+'|'
    })
    const route = new Route(coordinateString)
    //const route = new Route('33.693852,73.065305|33.916725,73.396740|34.072142,73.386269|33.591368,73.053589|')
    try{
        const shortestTrip = await route.calculateShortestTrip()
        // const shortestTrip = [
        //         {
        //             name: "Islamabad Expressway, Islamabad, Islamabad Capital Territory, Pakistan",
        //             type: "origin",
        //             distance: {
        //                 text: "0 km",
        //                 value: 0
        //             },
        //             duration: {
        //                 text: "0 mins",
        //                 value: 0
        //             },
        //             geometry: {
        //                 coordinates: {
        //                     lat: 33.693852,
        //                     lng: 73.065305
        //                 }
        //             }
        //         },
        //         {
        //             name: "Murree Rd, Rawalpindi, Punjab 46000, Pakistan",
        //             type: "origin",
        //             distance: {
        //                 text: "13.3 km",
        //                 value: 13274
        //             },
        //             duration: {
        //                 text: "21 mins",
        //                 value: 1277
        //             },
        //             geometry: {
        //                 coordinates: {
        //                     lat: 33.591368,
        //                     lng: 73.053589
        //                 }
        //             }
        //         },
        //         {
        //             name: "Kashmir Rd, Murree, Rawalpindi, Khyber Pakhtunkhwa, Pakistan",
        //             type: "origin",
        //             distance: {
        //                 text: "59.7 km",
        //                 value: 59695
        //             },
        //             duration: {
        //                 text: "1 hour 45 mins",
        //                 value: 6301
        //             },
        //             geometry: {
        //                 coordinates: {
        //                     lat: 33.916725,
        //                     lng: 73.396740
        //                 }
        //             }
        //         },
        //         {
        //             name: "Nathia Gali Rd, Nathia Gali, Abbottabad, Khyber Pakhtunkhwa, Pakistan",
        //             type: "origin",
        //             distance: {
        //                 text: "32.2 km",
        //                 value: 32192
        //             },
        //             duration: {
        //                 text: "1 hour 14 mins",
        //                 value: 4457
        //             },
        //             geometry: {
        //                 coordinates: {
        //                     lat: 34.072142,
        //                     lng: 73.386269
        //                 }
        //             }
        //         }
        //     ]
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
            dateSchedule = {...dateSchedule, [date]: [{locationstoVisit: temp, index: index+1}]}
        })
        res.send({tour: tour, dateSchedule})
    }
    catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})

module.exports = router;
