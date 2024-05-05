const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the user schema.
const userSchema = new Schema({
    name : { type: String, required: true },
    username: {type:String,required:true},
    email:{type:String, required: true, unique: true},
    password : { type: String, required: true },
},
    { timestamps: true }); // Adds createdAt and updatedAt fields with default values of Date.now()

    module.exports=mongoose.model("User",userSchema, "users");  // Create a model from the schema, and pass it the collection name 'users