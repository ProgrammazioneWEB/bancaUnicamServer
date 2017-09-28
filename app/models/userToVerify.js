// ============================================
// ======== User to verify Schema =============
// ============================================

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userToVerify = new Schema({ 
    numberOfAccount : {
        type : Number,
        required : true,
        unique : true
    },
    link : {
        type : String,
        required : true,
        unique : true
    }
});

module.exports = mongoose.model('UserToVerify', userToVerify);
