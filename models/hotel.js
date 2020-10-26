var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Hotel = new Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    amenities: {},
    basicInfo: {},
    facilityInfo: {},
    policies: {},
    roomInfo: [],
    geometry: {
        coordinates: { type: [Number], index: '2dsphere'}
    }
});

Hotel.query.getNearbyHotels = function(lat, lng, distance){
    return this.find({'geometry.coordinates': {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: distance
            }
        }})
}

module.exports = mongoose.model('Hotel', Hotel);
