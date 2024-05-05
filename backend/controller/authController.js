const Joi = require('joi');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const UserDTO = require('../dto/user'); 
const JWTService = require('../services/JWTServices');
const RefreshToken = require('../models/token');

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const authController ={
    async register(req,res,next){
        //validate user input
        const userRegisterSchema =Joi.object({
            username: Joi.string().min(5).max(30).required(),
            name:Joi.string().max(30).required(),
            email:Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required(),
            confirmPassword: Joi.ref('password')
        });

        const {error} = userRegisterSchema.validate(req.body);
        // if error in validation -> return error via middleware
        if(error) return next(error);

        //if email or message  already exist -> return an error
        const {username,name,email,password}= req.body;
        try {
            const emailInUse = await User.exists({email});
            const usernameInUse =await User.exists({username});
            if (emailInUse || usernameInUse) {
                return res.status(409).json({
                    status:'conflict',
                    message:`${emailInUse ? 'Email' : 'Username'} is already in use`
                })
                return next(error);
            }
            if (usernameInUse){
                const error ={
                    status :409,
                    message:"User not available, Choose Another Username!"
                }
                return next(error);
            }
            }
         catch (error) {
            return next(error);
        }



        // password hash
        const hashedPassword = await bcrypt.hash(password,12);
        // store user data in Database
        let accessToken;
        let refreshToken;
        let user;
        try {
            const userToRegister = new User({
                username,
                email,
                name,
                password: hashedPassword
            });
            user = await userToRegister.save();
            // Token Generation
            accessToken = JWTService.signAccessToken({_id:user._id},'30m');
            refreshToken = JWTService.signRefreshToken({_id:user._id},'60m');
        } catch (error) {
            return next(error);
        }
        // Store Refresh Token in DataBase
        await JWTService.storeRefreshToken(refreshToken,user._id);
        // Send Token in Cookies
        res.cookie('accessToken', accessToken , {
            maxAge:1000*60*60*24,
            httpOnly:true // Less the xss Attack 
        });
        res.cookie('refreshToken', refreshToken , {
            maxAge:1000*60*60*24,
            httpOnly : true,
        });
        // response send
        const userDto = new UserDTO(user);
        return  res.status(201).json({user:userDto , auth: true});
    },
    async login(req,res,next){
        
        
        //match username and password
        //return response
        //validate user input
        const userLoginSchema = Joi.object({
            username :Joi.string().min(5).max(30).required(),
            password:Joi.string().pattern(passwordPattern)
        });
        const {error} = userLoginSchema.validate(req.body);
        if(error){
            return next(error);
        }

        //if validation error ,return a bad request status and the errors in the
        const  {username,password}= req.body;
        //const username = req.body.username;
        //const  password = req.body.password;

        let user;
        try {
            // Match Username
            user = await User.findOne({username});
            
            if ( !user ) {
                const error ={
                    status: 401,
                    message: 'Invalid credentials'
                }
                return next(error);
            }
            // Match Password
            // req.body.password -> hash -> compare with user.password

            const match  =await bcrypt.compare(password,user.password);
            if(!match){
                const error ={
                status:401,
                message:'Invalid Password'
                }
                return  next(error);
            }


        } catch (error) {
            return next(error);
        }
        const accessToken = JWTService.signAccessToken({ _id: user._id},'30m');
        const refreshToken = JWTService.signRefreshToken({ _id: user._id},'60m');
        //Update Refresh Token In DataBase
        try {
            await RefreshToken.updateOne({
                _id:user._id
            },
            {token:refreshToken},
            {upset:true}
        );
        } catch (error) {
            return next(error);
        }

        //send Token in cookie
        res.cookie('accessToken', accessToken,{
            maxAge:1000*60*60*24,//24 Hours Token Time
            httpOnly : true,
        });
        res.cookie('refreshToken',refreshToken ,{
           maxAge:1000 *60*60*24,//24 Hour Token Time
           httpOnly:true,
       });
        const userDto = new  UserDTO(user);
        return res.status(200).json({user:userDto, auth:true});
    },
    async logout(req,res,next){
        //1. Delete Refresh Token From DataBase
        const {refreshToken}= req.cookies;
        try {
            await RefreshToken.deleteOne({ token : refreshToken }) ;
        } catch (error) {
            return next(error);
        }
        //2.Delete Cookie & Clear from Client Side
        res.clearCookie("accessToken", "refreshToken");
        // 3.  Response Send 
        res.status(200).json({ user: null, auth:false , message:"Logged Out Successfully"});
    },
    async refresh(req,res,next){
        // 1. Get RefreshToken From Cookies
        const originalRefreshToken = req.cookies.refreshToken;
        let id;
        try {
            id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
        } catch (e) {
            const error = {
            status : 401,
            message: 'Unauthorized'
        }
            return next(error);
    }

        //2. verify refreshToken
        try {
            const match = RefreshToken.findOne({_id : id , token : originalRefreshToken});
            if( !match ){
                const error ={
                    status : 401,
                    message:'Invalid or Expired Token! Please Login Again.'
                }
                return  next(error);
            }
        } catch (error) {
            return  next(error);
        }
        //3. Generate New Tokens
        try {
            const accessToken = JWTService.signAccessToken({_id: id},'30m');
            const refreshToken = JWTService.signRefreshToken({ _id : id },'60m');
            await RefreshToken.updateOne({_id : id} , {token : refreshToken}) ;
            res.cookie('accessToken', accessToken , {httpOnly : true , maxAge : 1000*60*60*24});
            res.cookie('refreshToken', refreshToken , {httpOnly : true , maxAge : 1000*60*60*24});
        } catch (error) {
            return next(error);
        }
        // 4. UpDate DataBase , Return Response
        const user = await User.findOne({_id :id });
        const userDto = new UserDTO(user);
        return res.status(200).json({user: userDto, auth: true});
    }
}

module.exports = authController;