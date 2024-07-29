const express = require('express');
const { processImages, checkStatus, upload } = require('../helpers/image_helper');

const router = express.Router();

router.post('/upload', upload.single('file'), processImages);
router.get('/status/:requestId', checkStatus);

module.exports = router;
