var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Rooms = new Schema({
    hotelroomid: {
        type: mongoose.Types.ObjectId,
        ref: 'Hotel'
    },
    rooms:[{
        required: true
    }
    ]
});

module.exports = mongoose.model('Rooms', Rooms);
