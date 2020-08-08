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
                res.json(rooms.length);
            }
        });
})


router.post('/rooms/book', (req, res)=>{
    Booking.findByIdAndUpdate(req.body.roomID, {
        $push: {"bookings": {from: req.body.from, to: req.body.to}}
    }, {
        safe: true,
        new: true
    }, function(err, room){
        if(err){
            res.send(err);
        } else {
            res.json(room);
        }
    });
})
module.exports = router
