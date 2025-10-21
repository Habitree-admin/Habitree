// config/multer.config.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './bucket/');
    },
    filename: function (req, file, callback) {
        callback(null, new Date().getMilliseconds() + file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;