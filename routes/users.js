const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/user');
const Hotel = require('../models/hotel')
const passport = require('passport');
const authenticate = require('../middlewares/authenticate');
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/',authenticate.verifyUser, function(req, res, next) {
  User.find({})
      .then((user) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(user);
      }, (err) => next(err))
      .catch((err) => next(err));
});

router.get('/isuser/:number', async (req, res)=>{
  await User.findOne({username : req.params.number }).exec((err, user)=>{
    if(user){
      res.send({status: true})
    }
    else{
      res.send({status: false})
    }
  });
})

router.get('/logout', (req, res) => {
  if (req.session) {
    console.log("IFF")
    req.session.destroy();
    res.clearCookie('session-id');
    res.send({status: true});
  } else {
    console.log("ELSE")
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get('/hotel/:userid', authenticate.verifyUser, async(req, res)=>{
  console.log('entered')
  try{
    const hotel = await Hotel.findOne({user: req.params.userid}).exec()
    if(hotel){
      res.status(200).send({success: true, hotel})
    }
    else{
      res.status(400).send({success: false, hotel})
    }
  }
  catch(e){
    res.status(400).send({success: false, error: 'Cannot find hotel'})
  }
})

router.post('/signup', (req, res, next) => {
  User.register(new User({ username: req.body.username }),
      req.body.password, (err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({ err: err });
        } else {
          if (req.body.type)
            user.type = req.body.type;
          user.save((err, user) => {
            if (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.json({ err: err });
              return;
            }
            passport.authenticate('local')(req, res, () => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json({ success: true, status: 'Registration Successful!' });
            });
          });
        }
      });
});


router.post('/login', passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({ _id: req.user._id });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success: true, token: token, status: 'You are successfully logged in!',user:req.user });
});

router.post('/addhotel', authenticate.verifyUser, async(req, res)=>{
  console.log('entered')
  try{
    const user = await User.findById(req.user).exec();
    if(user){
      await Hotel.create(req.body)
      res.status(200).send({success: true})
    }
    else{
      res.status(400).send({success: false, error: 'User not found'})
    }
  }
  catch (e) {
    res.status(400).send({success: false})
  }
})

router.post('/addrooms', authenticate.verifyUser, async(req, res)=>{
  try{
    const user = await User.findById(req.user).exec();
    if(user){
      await Hotel.create(req.body)
      res.status(200).send({success: true})
    }
    else{
      res.status(400).send({success: false, error: 'User not found'})
    }
  }
  catch (e) {
    res.status(400).send({success: false})
  }
})

module.exports = router;
