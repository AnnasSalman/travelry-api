const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Hotel = require('../models/hotel')
const authenticate = require('../middlewares/authenticate');
const upload = require('../middlewares/multer')
const hotelUpload = require('../middlewares/multerHotels')
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
        }
        else{
            res.send(files)
        }
    })
})

router.get('/:hotelid/getimages', (req, res)=>{
    glob(req.params.hotelid+'-hotel1.jpg',options,  (err, files) => {
        if(err){
            res.send(err)
        }
        else{
            res.send(files)
        }
    })
})

router.get('/gethotelsnearme', async(req, res)=>{
    try{
        const lat = req.query.lat
        const lng = req.query.lng
        const hotels = await Hotel.find({}).getNearbyHotels(lat, lng, 12000)
        res.send(hotels)
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.get('/room/images/:image', (req, res)=>{
    res.sendFile(path.join(__dirname, '../public/uploads', req.params.image))
})

router.get('/hotel/images/:image', (req, res)=>{
    console.log('eintachat')
    res.sendFile(path.join(__dirname, '../public/uploads', req.params.image))
})

router.post('/:hotelid/uploadimages/:roomid', (req, res) => {
    console.log(req.files)
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

router.post('/:hotelid/uploadimages', (req, res) => {
    hotelUpload(req, res, (err) => {
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

router.post('/:hotelid/updatehotellocation', async(req,res)=>{
    try{
        const status = await Hotel.findByIdAndUpdate(req.params.hotelid,{
            geometry: req.body.geometry
        })
        res.send(status)
    }
    catch(e){
        res.status(400).send(e)
    }
})

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
