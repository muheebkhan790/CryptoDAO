const Joi = require('joi');
const fs = require('fs');
const Blog = require('../models/blog');
const {BACKEND_SERVER_PATH} = require('../config/index');
const BlogDTO = require('../dto/blog');
const BlogDetailsDTO = require('../dto/blog-details');
const Comment =require('../models/comment');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const blogController={
    async create(req, res, next){
            const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            content: Joi.string().required(),
            // client side -> base64 encoded string -> decode -> store -> save photo's path in db
            photo: Joi.string().required(),
            });
    
    // 1. Validate Req Body
    const {error}= createBlogSchema.validate(req.body);
        if (error) return next(error);
        const {title,author,content,photo} = req.body;

    // 2. Handle Photo Storage , Naming
    // Read as Buffer
    const buffer = Buffer.from(
        photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
        "base64"
        );
    // Allot a  unique name for the image
    const imagePath = `${Date.now()}-${author}.png`;
    //  Save it to Images Folder Locally
    try {
        fs.writeFileSync(`storage/${imagePath}`,buffer);
    } catch (error) {
        return next(error);
    }
    // 3. Add TO DataBase
    // Save Blog In DataBase
    let newBlog;
    try {
        newBlog = new Blog({
            title,
            author,
            content,
            photoPath:`${BACKEND_SERVER_PATH}/storage/${imagePath}`
        });
        await newBlog.save();
    } catch (error) {
        return next(error);
    }
    // 4. Return Res 
    const blogDto = new BlogDTO(newBlog);
    res.status(201).json({blog: blogDto});
    },
    async getAll(req,res,next) {
        try {
            const blogs = await Blog.find({});
            const blogsDto = [];
            for(let i=0; i<blogs.length; i++){
                const dto = new BlogDTO(blogs[i]);
                blogsDto.push(dto);
            }
            return res.status(200).json({blogs: blogsDto});
        } catch (error) {
            return next(error);

        }
    },
    async getById(req,res,next){
        // Validate ID
        const getByIdSchema =Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
        const {error} = getByIdSchema.validate(req.params);
        if(error) return next (error);
        // response 
        let blog;
        const {id}=req.params;
        try {
            blog = await Blog.findOne({_id: id}).populate('author');
        } catch (error) {
            return next(error);
        }
        const blogDto = new BlogDetailsDTO(blog);
        return res.status(200).json({blog: blogDto});
    },
    async update(req,res,next){
        // Validation
        const updateBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            author:Joi.string().regex(mongodbIdPattern).required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
            photo: Joi.string()
            });
            const {error} = updateBlogSchema.validate(req.body);
            const {title, content, author, blogId , photo} = req.body;

            let blog;
            try {
                blog = await Blog.findOne({_id: blogId});
            } catch (error) {
                return next(error);
            }
            if(photo){
                let previousPhoto = blog.photoPath;
                previousPhoto  = previousPhoto.split('/').at(-1);
                // Delete Previous Photo
                fs.unlinkSync(`storage/${previousPhoto}`);
                // Save New Photo in the database
                // Read as Buffer
    const buffer = Buffer.from(
        photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
        "base64"
        );
    // Allot a  unique name for the image
    const imagePath = `${Date.now()}-${author}.png`;
    //  Save it to Images Folder Locally
    try {
        fs.writeFileSync(`storage/${imagePath}`,buffer);
    } catch (error) {
        return next(error);
    }
        await Blog.updateOne({_id: blogId},
            {title , content, photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`}
        );
    }
    else{
        await Blog.updateOne({_id :blogId}, {title,content}) ;
    }
    return res.status(200).json({message:'blog Updated'});
    },
    async delete(req,res,next){
        // Validate _id
        const deleteBlogSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        });
        const {error} = deleteBlogSchema.validate(req.params);
        const {id}= req.params;
        // Delete Blog
        try {
            await Blog.deleteOne({_id: id});
            // Delete Comments on this Blog
            await Comment.deleteMany({blog: id});
        } catch (error) {
            return next(error);
        }
        return res.status(200).json({message: 'Blog Deleted'});
    }
}

module.exports = blogController;