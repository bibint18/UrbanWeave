const express = require('express');
const path = require('path');
const app =express();
const mongoose = require('mongoose')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
mongoose.connect(process.env.MONGO_URI,{
})
.then(() => console.log("Connected to mongodb"))
.catch((err) => console.log('Failed to connect',err))
const port =2001;
app.use(express.urlencoded({extended:true}))
const adminRoute = require('./routes/adminRoute');
const userRoute = require('./routes/userRoute');
app.use(cookieParser())
app.use('/',adminRoute);
app.use('/',userRoute);
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,"./public")))
app.get('/',(req,res) => {
  res.send("helo")
})
app.listen(port,() => console.log(`server is running on port ${port}`)) 