const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Hotel = require('../models/hotel')
const Booking = require('../models/booking')
const authenticate = require('../middlewares/authenticate');
const path = require('path')

router.use(bodyParser.json());

router.get('/findrooms', async (req, res)=>{
        Booking.find({
            guestlimit: {$gt: parseInt(req.query.guests)-1},
            price: {$gte: req.query.lower, $lte: req.query.upper},
            bookings: {
                $not: {
                    $elemMatch: {from: {$lt: req.query.to.substring(0,10)}, to: {$gt: req.query.from.substring(0,10)}}
                }
            }
        }, function(err, rooms){
            if(err){
                res.send(err);
            } else {
                res.json(rooms);
            }
        });
})

router.get('/findroomsbyid/:hotelid/:roomid', async (req, res)=> {
    try{
        const rooms = await Hotel.findOne({_id: req.params.hotelid, "roomInfo.key": req.params.roomid})
        let response = {}
        rooms.roomInfo.forEach((room)=>{
            if(room.key === req.params.roomid){
                response = {roomInfo: room, hotelInfo: rooms.basicInfo, amenities: rooms.amenities.rooms, hotelid: rooms._id}
            }
        })
        res.status(200).send(response)
    }
    catch(e){
        res.send(e)
    }
})

router.get('/:date/hotel/:id', (req,res)=>{
    Booking.find({
        hotelid: req.params.id,
        bookings: {
            $elemMatch: {
                from: req.params.date
            }
        }
    },
        function(err, rooms){
            if(err){
                res.send(err);
            } else {
                res.json(rooms);
            }
        })
})

router.get('/hotel/:id/month/:month/year/:year', async(req,res)=>{
    let monthresponse = {}
    for(let i = 1; i <= 31; i++){
        let arriving = 0
        let leaving = 0
        const date= new Date(parseInt(req.params.year),parseInt(req.params.month)-1,i+1)
        const dateString = date.toISOString().slice(0,10)
        const rooms1 = await Booking.find({
                hotelid: req.params.id,
                bookings: {
                    $elemMatch: {
                        from: dateString
                    }
                }
            })
        arriving = rooms1.length
        const rooms2 = await Booking.find({
                hotelid: req.params.id,
                bookings: {
                    $elemMatch: {
                        to: dateString
                    }
                }
            })
        leaving = rooms2.length
        if(leaving>0 || arriving>0){
            const result = {[dateString]: [{arriving, leaving, dateString}]}
            const temp = monthresponse
            monthresponse = {...temp, ...result}
        }
    }
    res.status(200).json(monthresponse);
})

router.get('/hotel/:id/occupancy', async(req, res)=> {
    const response = {}
    const todayFrom = new Date(req.query.from)
    const todayTo = new Date(req.query.to)
    const yesterdayFrom = new Date(req.query.from)
    yesterdayFrom.setDate(yesterdayFrom.getDate()-1)
    const yesterdayTo = new Date(req.query.from)
    const tomorrowFrom = new Date(req.query.to)
    const tomorrowTo = new Date(req.query.to)
    tomorrowTo.setDate(tomorrowFrom.getDate()+1)

    try{
        const occToday = await Booking.find({
            hotelid: req.params.id,
            bookings: {
                $elemMatch: {from: {$lt: req.query.to.substring(0,10)}, to: {$gt: req.query.from.substring(0,10)}}
            }
        });
        response.occupancyToday = occToday.length
        const occYesterday = await Booking.find({
            hotelid: req.params.id,
            bookings: {
                $elemMatch: {from: {$lt: yesterdayTo.toISOString().substring(0,10)}, to: {$gt: yesterdayFrom.toISOString().substring(0,10)}}
            }
        });
        response.occupancyYesterday = occYesterday.length
        const occTomorrow = await Booking.find({
            hotelid: req.params.id,
            bookings: {
                $elemMatch: {from: {$lt: tomorrowTo.toISOString().substring(0,10)}, to: {$gt: tomorrowFrom.toISOString().substring(0,10)}}
            }
        });
        response.occupancyTomorrow =occTomorrow.length
        res.status(200).send(response)
    }
    catch(e){
        console.log(e)
        res.status(400).send()
    }
})

router.get('/hotel/checkroomsavailability',async(req, res)=>{
    try{
        const Rooms = await Booking.find({
            hotelid: req.query.hotelid,
            roomid: req.query.roomid,
            bookings:{
                $not:{
                    $elemMatch: {from: {$lt: req.query.to.substring(0,10)}, to: {$gt: req.query.from.substring(0,10)}}
                }
            }
        })
        if(Rooms.length>=req.query.number){
            const roomResponse = []
            for(let i =0; i<req.query.number; i++){
                roomResponse.push(Rooms[i]._id)
            }
            res.send({status: true, rooms: roomResponse, length: roomResponse.length})
        }
        else{
            res.send({status:false, rooms: Rooms, length:Rooms.length})
        }
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.post('/rooms/book', async(req, res)=>{

    for(const roomSpecificId of req.body.roomSpecificIds){
        const rooms = []
        const room = await Booking.find({
            _id: roomSpecificId,
            bookings:{
                $not:{
                    $elemMatch: {from: {$lt: req.body.to.substring(0,10)}, to: {$gt: req.body.from.substring(0,10)}}
                }
            }
        })
        rooms.push(room)
    }
    if(req.body.roomSpecificIds.length==rooms.length){
        const bookings = []
        for(const roomSpecificId of req.body.roomSpecificIds){
            const booking = Booking.findByIdAndUpdate(roomSpecificID, {
                $push: {"bookings": {from: req.body.from, to: req.body.to}}
            }, {
                safe: true,
                new: true
            })
            bookings.push(booking)
        }
        res.send(bookings)
    }
    else{
        res.status(400).send()
    }

})
module.exports = router
