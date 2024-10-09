const jwt = require('jsonwebtoken')
require('dotenv').config();
exports.signToken=((user) => {
  return jwt.sign(
    {id:user._id,email:user.email},
    process.env.JWT_SECRET,
    {expiresIn:'1hr'}
  )
})

exports.signAdminToken = ((admin) => {
  return jwt.sign(
    {id:admin._id,email:admin.email},
  process.env.JWT_SECRET_ADMIN,
  {expiresIn:'1hr'},
  )
})