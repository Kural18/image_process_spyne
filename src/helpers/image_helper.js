const { Request, Product, Image, sequelize } = require('../models');
const { processImagesAsync } = require('../utils/image_utils');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const csvParser = require('csv-parser');
const stream = require('stream');

const upload = multer();


const processImages = async (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const requestId = uuidv4();

  // Start a transaction
  const transaction = await sequelize.transaction();
  const results = [];

  try {
    const request = await Request.create({ id: requestId }, { transaction });

    const csvStream = new stream.PassThrough();
    csvStream.end(file.buffer);

    csvStream
      .pipe(csvParser({
        headers: ['S. No.', 'Product Name', 'Input Image Urls'], 
        skipLines: 1 
      }))
      .on('data', (data) => {
        const serialNumber = data['S. No.'];
        const productName = data['Product Name'];
        const inputUrls = data['Input Image Urls'];
        results.push({ serialNumber, productName, inputUrls });
      })
      .on('end', async () => {
        for (const { productName, inputUrls } of results) {

          // console.log("Product Name:", productName);
          // console.log("Input URLs:", inputUrls);

          const product = await Product.create({
            name: productName,
            requestId: request.id,
          }, { transaction });

          await request.addProduct(product, { transaction });
          
          const imageUrls = inputUrls.split(',');
          for (const url of imageUrls) {
            const image = await Image.create({
              url: url.trim(),
              productId: product.id,
            }, { transaction });

            await product.addImage(image, { transaction });
          }
        }

        await transaction.commit();


        processImagesAsync(requestId);


        res.json({ requestId });
      })
      .on('error', async (error) => {
        await transaction.rollback();
        res.status(500).json({ error: 'Processing failed' });
      });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Processing failed' });
  }
};


const checkStatus = async (req, res) => {
  const { requestId } = req.params;
  
  try {
    const request = await Request.findByPk(requestId);

    if (request) {
      res.json({ requestId, status: request.status });
    } else {
      res.status(404).json({ error: 'Request not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving request status' });
  }
};

module.exports = { processImages, checkStatus, upload };
