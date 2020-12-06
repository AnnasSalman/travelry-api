const hotelSearch = require('../models/hotel')
const Booking = require('../models/booking')

class Hotel{
    constructor() {

    }

    async searchHotel(){
        const hotels = await hotelSearch.find().getNearbyHotels(33.906528,73.393692,15000)
        const hotelIdArray = hotels.map((hotelObject)=>(
            hotelObject._id
        ))
        const available  = await Booking.find({
            guestlimit: {$gt: 2},
            price: {$gte: 0, $lte: 10000},
            // bookings: {
            //     $not: {
            //         $elemMatch: {from: {$lt: req.query.to.substring(0,10)}, to: {$gt: req.query.from.substring(0,10)}}
            //     }
            // }
        }).where('hotelid').in(hotelIdArray).exec();
        return {leength: available.length}
    }
}

module.exports = Hotel
