const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Hotel = require('../models/hotel')
const authenticate = require('../middlewares/authenticate');
const upload = require('../middlewares/multer')
const glob = require('glob')
const path = require('path')
const fs = require('fs')

options = {
    cwd: './public/uploads'
},

router.use(bodyParser.json());

router.get('/:hotelid/getimages/:roomid', (req, res)=>{
    glob(req.params.hotelid+'-'+req.params.roomid+'-*.jpg',options,  (err, files) => {
        if(err){
            res.send(err)
            //res.sendfile('./public/uploads/somehotelia-someroomia-pic1.jpg')
        }
        else{
            res.send(files)
        }
    })
})

router.get('/room/images/:image', (req, res)=>{
    res.sendFile(path.join(__dirname, '../public/uploads', req.params.image))
})

router.post('/:hotelid/uploadimages/:roomid', (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.status(400).send(err)
        } else {
            if(req.files == undefined){
                res.status(400).send({error: 'undefined'});
            } else {
                res.status(200).send({status: 'done'});
            }
        }
    });
});

router.delete('/room/deleteimage/:image',(req, res)=>{
    fs.unlink(path.join(__dirname, '../public/uploads', req.params.image), (err) => {
        if (err) {
            console.error(err)
            res.status(400).send(err)
        }
        res.status(200).send()
    })
})

module.exports = router
