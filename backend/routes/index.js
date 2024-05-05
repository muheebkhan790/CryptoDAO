const express = require('express');
const authController = require('../controller/authController');
const blogController = require('../controller/blogController');
const commentController = require('../controller/commentController');
const auth = require('../middlewares/auth');
const router = express.Router();

// // Testing 

// router.get('/test', (req, res) => {
//     console.log(req);
//     //res.send("Hello World!");
//     let data = {message: "This is a test message from the server!"};
//     res.json(data);
// });
// Auth Route
//Register
router.post('/register', authController.register);
//Login 
router.post('/login', authController.login );
// LogOut
router.post('/logout', auth ,authController.logout);
// Refresh
router.get('/refresh', authController.refresh);

//Blog Routes
// 1. Create
router.post("/blog", auth , blogController.create);
// 2. Get ALL Blogs
router.get("/blog/all", auth , blogController.getAll);
// 3. Get Blog By id 
router.get("/blog/:id" , auth , blogController.getById);
// 4. UpDate 
router.put("/blog" , auth ,  blogController.update);
// 5. Delete  
router.delete("/blog/:id" , auth , blogController.delete);

// Comments Routes
// Create
router.post("/comment" , auth , commentController.create);
// Get All comments for one post
router.get("/comment/:id" , auth , commentController.getById);

module.exports =  router;