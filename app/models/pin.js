// ======================================
// ======== Pin Schema =============
// ======================================

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pin = new Schema({
    number : {
        type : Number,
        unique : true,
        required : true,
    },
    meta : {
        firstName : {
            type : String,
            required : true
        },
        lastName : {
            type : String,
            required : true
        },
        dateOfBirth : {
            type : Date,
            required : true
        },
        numberOfPhone : {
            type: Number,
            required : true
        },
        residence : {
            type : String
        },
        fiscalCode : {
            type : String,
            unique : true
        }
    },
    availableBalance : {
        type : Number,
        required : true,
        default : 0
    }
});

module.exports = mongoose.model('Pin', pin);