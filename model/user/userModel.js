const mongoose = require('mongoose')
const { type } = require('os')
const bcrypt = require('bcrypt')
const userSchema = mongoose.Schema({
  username:{
    type:String,
    required:false
  },
  email:{
    type:String,
    unique:true,
    required:true
  },
  googleId:{
    type:String,
    unique:false,
  },
  password:{
    type:String,
    required:false
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: false
  },
  mobile: {
    type: String,
    required: false
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  isVerified: {
     type: Boolean, 
     default: false 
    },
    passwordResetToken:String,
    passwordResetExpiry:Date,
})
//hashing before save
userSchema.pre("save", async function (next){
  if(!this.isModified("password")) return next();
  this.password =await bcrypt.hash(this.password,10)
  next();
})

userSchema.methods.comparePassword = function(userPswd){
  return bcrypt.compare(userPswd,this.password)
}

// userSchema.methods.createPasswordResetToken =function(){
//   const resetToken = crypto.randomBytes(32).toString('hex')
//   const passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex')
//   const passwordResetExpiry= Date.now() + 10 * 60 * 1000
//   return resetToken;
// }




module.exports = mongoose.model('users',userSchema)
