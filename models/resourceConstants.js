let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let resourceConstants = new Schema({
    resourceName: {
        type: 'String',
    },
    value: {
        type: 'String'
    },
    updatedAt:{
        type: 'String'
    }
});

module.exports = mongoose.model('resourceSources', resourceConstants);
