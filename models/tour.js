var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Tour = new Schema({
    tour:{},
    dateSchedule:{},
    totalTourDistance:{},
    public: {
        type: 'Boolean'
    },
    cities: {},
    title: {
        type: 'String'
    },
    description: {
        type: 'String'
    },
    user: {},
    ratings: [],
    geometry: {
        coordinates: { type: [Number], index: '2dsphere'}
    }

});

Tour.query.getNearbyTours = function(lat, lng, distance){
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

module.exports = mongoose.model('Tour', Tour);
