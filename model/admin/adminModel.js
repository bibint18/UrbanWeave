const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { type } = require("os");
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password =await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports=mongoose.model('admin',adminSchema)
