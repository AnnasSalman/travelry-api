var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Booking = new Schema({
    hotelid: {
        type: String
    },
    roomid: {
        type: String
    },
    bookings: [
        {
            from: String,
            to: String
        }
    ],
    guestlimit: {type: Number},
    price: {type: Number}


});

module.exports = mongoose.model('Booking', Booking);
