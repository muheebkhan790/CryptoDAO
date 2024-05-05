const JWTService =  require('../services/JWTServices');
const User = require('../models/user');
const UserDTO = require('../dto/user');


const auth = async(req, res, next) =>{
    try {
        // 1. Refresh , Access Token Validation
    const {refreshToken, accessToken} = req.cookies;
    if(!accessToken || !refreshToken){
        const error ={
            status: 401,
            message:'Unautherized'
        }
        return next(error);
    }
    let _id;
    try {
        _id=JWTService.verifyAccessToken(accessToken)._id;
    } catch (error) {
        return  next(error);
    }
    let user;
    try {
        user = await User.findOne({_id: _id});
    }
    catch (error) {
        return next(error);
    }
    const userDto = new UserDTO(user);
    req.user= userDto;
    next();
    } catch (error) {
        return next(error);
    }
}

module.exports = auth;