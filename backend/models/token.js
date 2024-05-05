const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');

const { Schema} = mongoose;

const refreshTokenSchema = Schema({
    token: { type: String, required: true },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,  
        ref: 'User',  
        required: true  }
     },
     {timestamps:true}
);
module.exports= mongoose.model('RefreshToken', refreshTokenSchema,'tokens');