const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null,req.params.hotelid+'-'+req.params.roomid+'-'+file.fieldname + '.jpg');
        console.log(file)
    }
});

// Check File Type
function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    } else {
        cb('Error: Images Only!');
    }
}

// Init Upload
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pic1', maxCount: 1 },
    { name: 'pic2', maxCount: 1 },
    { name: 'pic3', maxCount: 1 },
    { name: 'pic4', maxCount: 1 },
]);

module.exports = upload
