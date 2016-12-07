// configure server
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var port = process.env.PORT || 8000;
var app = express();

// configure database
var morgan = require('morgan');
var mongoose = require('mongoose');
mongoose.connect('mongodb://bartek:hassle1@ds119598.mlab.com:19598/heroku_4800qm90');
var db = mongoose.connection;
var User = require('./userModel.js');
app.use(morgan('dev')); //to log every request to the console

// configure authentication
var session = require('express-session');
var passport = require('passport');
require('./auth.js')(passport);
app.use(session({
  secret: 'squirrel',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// configure twilio
var twilioService = require('./sms/sms.js');

// server static files
app.use('/', express.static(path.join(__dirname, '../client')));
//app.use('/fail', express.static(path.join(__dirname, '../client/assets/doNotWant.jpg')));
app.use('/modules', express.static(path.join(__dirname, '../node_modules')));

// parse requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// authentication routes
app.get('/auth/facebook', passport.authenticate('facebook', {
  scope: 'email'
}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/fail'
}));


// new user routes
//======angular AJAX request listeners below
//===post request from goals page

app.post('/goal', function(req, res) {
  req.body.responses = Array(90);
  req.body.responses.startDate = Date.now();
  User.create(req.body, function(err, results) {
    if (err) {
      res.send (err);
    }
    console.log(req.body);
    res.send(results);
  });
});



// twilio routes
app.get('/messageToConsole', function(req, res) {
  twilioService.responseMaker(req, res);
  //link to model
});


//adding third page get request here======
app.get('/status', function(req, res) {
  User.find({name : 'Bartek'},function(err, user){
    if(err){
      res.send(err);
    }
    console.log('server received request from status page')
    res.json(user)
  })
});

// start server
app.listen(port);
console.log('Listening on port ' + port + '...');

// spam routine
exports.spam = function() {
  // query database for all users
  User.find((err, users) => {
    // iterate through and apply periodic goal poll
    users.forEach(user => {
      // if it's their last day, drop their ass
      twilioService.periodicGoalPoll(user.phoneNumber, user.goal);
    });
    // celebrate completion
    console.log('spammed the shit out of \'em');
  });
};

//exports.spam();
