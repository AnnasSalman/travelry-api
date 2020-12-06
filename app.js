var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var hotelRouter = require('./routes/hotels')
var bookingRouter = require('./routes/bookings')
var toursRouter = require('./routes/tours')
var passport = require('passport');
var config = require('./config');
var cors = require('cors');
var authenticate = require('./middlewares/authenticate');
var CronJob = require('cron').CronJob;
var Resources = require('./classes/Resources')

const ResourceUpdates = new Resources()

const updateFuelPrices = new CronJob('00 00 00 * * *', async () => {
    try{
        await ResourceUpdates.updatePetrolPrice()
        console.log('Updated Petrol Price')
    }
    catch(e){
        console.log('error updating petrol prices')
    }
}, null, true, 'Asia/Karachi');
updateFuelPrices.start();

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({path: path.resolve( __dirname,'secrets.env')});
    console.log('loaded')
}

const connection = mongoose.connect('mongodb://localhost:27017/travelry-api', { useNewUrlParser: true, useUnifiedTopology: true });
var app = express();
connection.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });
app.use(passport.initialize());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hotels', hotelRouter);
app.use('/bookings', bookingRouter)
app.use('/tours', toursRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});



// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
