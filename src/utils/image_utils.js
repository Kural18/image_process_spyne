const axios = require('axios');
const sharp = require('sharp');
const { Request, Product, Image, sequelize } = require('../models');
const cloudinary = require('../../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

const processImagesAsync = async (requestId) => {
  try {

    const request = await Request.findByPk(requestId, {
      include: [
        {
          model: Product,
          as: 'products',
          include: [
            {
              model: Image,
              as: 'images'
            }
          ]
        }
      ]
    });


    if (!request) {
      console.error(`Request with ID ${requestId} not found`);
      return;
    }


    for (const product of request.products) {
      console.log(`Processing product: ${product.name}`);


      for (const image of product.images) {
        try {
          console.log(`Processing image URL: ${image.url}`);


          const response = await axios({ url: image.url, responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(response.data, 'binary');

          const metadata = await sharp(imageBuffer).metadata();
          const width = metadata.width;
          console.log(`Original image width: ${width}`);


          if (width) {
            const compressedBuffer = await sharp(imageBuffer)
            .resize({ width: Math.floor(width / 2) }) 
            .jpeg({ quality: 50 }) 
            .toBuffer();

            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                if (error) {
                  console.error(`Cloudinary upload failed for image URL: ${image.url}`);
                  reject(error);
                } else {
                  console.log(`Image uploaded to Cloudinary: ${result.secure_url}`);
                  resolve(result);
                }
              }).end(compressedBuffer);
            });


            await image.update({ compressedUrl: result.secure_url });
            console.log(`Image record updated with compressed URL: ${result.secure_url}`);
          } else {
            console.warn(`Could not determine width for image URL: ${image.url}`);
          }
        } catch (error) {
          console.error(`Failed to process image URL: ${image.url}, Error: ${error.message}`);
        }
      }
    }


    await Request.update({ status: 'completed' }, { where: { id: requestId } });
    console.log(`Request ${requestId} status updated to 'completed'`);

  } catch (error) {
    console.error(`Failed to process request ID: ${requestId}, Error: ${error.message}`);
  }
};

module.exports = { processImagesAsync };
