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
});

module.exports = mongoose.model('Hotel', Hotel);
