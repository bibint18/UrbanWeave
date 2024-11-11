const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const User = require('../model/user/userModel')
const path = require("path")
const User = require(path.resolve(__dirname, '../model/user/userModel'));
require("dotenv").config()

console.log("ueser:",User)
console.log("client id",process.env.GOOGLE_CLIENT_ID)
console.log("secre",process.env.GOOGLE_CLIENT_SECRET)

passport.use(new GoogleStrategy( {
  clientID:process.env.GOOGLE_CLIENT_ID,
  clientSecret:process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:'/auth/google/callback',
  prompt:'select_account',
  ignoreTokens:true
},
  async (accessToken,refreshToken,profile,done) => {
    try {
       let user = await User.findOne({googleId:profile.id});
       console.log("profile: ",profile)
       console.log("after user: ",user)
       if(user){
        return  done(null,user) 
       }
       if(!user){
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
  console.log("serialized")
  done(null,user.id)
})

passport.deserializeUser((id,done) => {
  User.findById(id)
  .then(user => {
    console.log("deseri user")
    done(null,user)
  })
  .catch(err => {
    console.log("err",err)
    done(err,null)
  })
})


module.exports=passport;