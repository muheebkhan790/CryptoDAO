const mongoose = require('mongoose');
const {MONGODB_CONNECTION_STRING} = require('../config/index');

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_CONNECTION_STRING);
        console.log(`MongoDB connected:${conn.connection.host}`); 
    } catch (error) {
        console.log(`Error:${error}`);
    }
}

module.exports=dbConnect;

//process.env is a built-in object in NodeJS that lets you access environment