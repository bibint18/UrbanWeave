const jwt = require('jsonwebtoken')
require('dotenv').config();
exports.signToken=((user) => {
  return jwt.sign(
    {id:user._id,email:user.email},
    process.env.JWT_SECRET,
    {expiresIn:'1hr'}
  )
})