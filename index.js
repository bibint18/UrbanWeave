const express = require('express');
const path = require('path');
const app =express();
const redis = require('redis')
const mongoose = require('mongoose')
const passport = require('./config/passport')
const methodOverride = require('method-override');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
const session = require('express-session');
// const redisClient = redis.createClient();
// redisClient.on('error', (err) => {
//   console.error('Redis error:', err);
// });
// redisClient.connect().then(() => {
//   console.log('Connected to Redis');
// });
// mongoose.connect(process.env.MONGO_URI,{
// })
// .then(() => console.log("Connected to mongodb")
// initializeCounter();
// )
// .catch((err) => console.log('Failed to connect',err))

mongoose.connect(process.env.MONGO_URI, {
})
.then(() => {
  console.log("Connected to mongodb");
  initializeCounter();  
})
.catch((err) => console.log('Failed to connect', err));
const port =2001;

app.use(cookieParser())
app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(methodOverride('method'));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set secure to true if using HTTPS
}));


app.use(passport.initialize())
app.use(passport.session(false));

const adminRoute = require('./routes/adminRoute');
const userRoute = require('./routes/userRoute');
const { initializeCounter } = require('./utils/orderUtils');


app.set('view engine','ejs');
app.use('/admin',adminRoute);
app.use('/',userRoute);

// app.use('/uploads',express.static(path.join(__dirname,"uploads")))
app.get('/',(req,res) => {
  res.send("helo")
})
app.listen(port,() => console.log(`server is running on port ${port}`)) 
