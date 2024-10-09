const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const User = require('../model/user/userModel')
const path = require("path")
const User = require(path.resolve(__dirname, '../model/user/userModel'));

console.log(User)
 require("dotenv").config()
console.log(process.env.GOOGLE_CLIENT_ID)
console.log(process.env.GOOGLE_CLIENT_SECRET)

passport.use(new GoogleStrategy({
  clientID:process.env.GOOGLE_CLIENT_ID,
  clientSecret:process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:'/auth/google/callback',
  prompt:'consent',
},
  async (accessToken,refreshToken,profile,done) => {
    try {
       let user = await User.findOne({googleId:profile.id});
       if(user && user.isBlocked){
        console.log("user blocked")
        return  done(null,false,{message:'user has been deleted'}); 
       }else{
        user = new User({
          name:profile.displayName,
          email:profile.emails[0].value,
          googleId:profile.id,
        });
        await user.save();
        return done(null,user)
       }
    } catch (error) {
      return done(error,null)
    }
  }
));

passport.serializeUser((user,done) => {
  done(null,user.id)
})

passport.deserializeUser((id,done) => {
  User.findById(id)
  .then(user => {
    done(null,user)
  })
  .catch(err => {
    done(err,null)
  })
})


module.exports=passport;