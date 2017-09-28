// ======================================
// ======== Movement Schema =============
// ======================================

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var movement = new Schema({
    from : {
        type : Number,
        required : true
    },
    to : {
        type : Number,
        required : true
    },
    date : {
        type : Date,
        required : true
    },
    quantity : {
        type : Number,
        required : true
    }
});

module.exports = mongoose.model('Movement', movement);