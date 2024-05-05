const mongoose =require('mongoose');

const {Schema} =mongoose;

const blogSchema = new Schema({
    title: {type:String, required:true},
    content:{ type: String ,required : true },
    photoPath:{type:String},
    author:{type:mongoose.Schema.Types.ObjectId,ref:'User'}, // 
},
    {timestamps:true});//this will add createdAt and updatedAt to our Blog model

    module.exports= mongoose.model("Blog",blogSchema,  "blogs");

