const jwt = require('jsonwebtoken')
const User = require('../model/user/userModel')
const jwtService = require('../services/jwtService')
exports.protect = async (req,res,next) => {
  const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];
  if(!token){
    return res.send("no token user not loggedin")
  }
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if(!user){
      return res.send("no user in databse");
    }
    req.user = user
    next();
  }catch(err){
    return res.send(err)
  }
}

exports.isLoggedIn = (req,res,next)=> {
  const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1]
  console.log(token)
  if(!token){
    return next()
  }
  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    if(decoded){
      console.log(decoded)
      res.redirect('/home')
    }
  }catch(err){
    return next()
  }
}