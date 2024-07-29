const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Request = sequelize.define('Request', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },
});

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  requestId: {
    type: DataTypes.UUID,
    references: {
      model: 'Requests',
      key: 'id',
    }
  },
  name: {
    type: DataTypes.STRING,
  }
});

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
  },
  compressedUrl: {
    type: DataTypes.STRING,
  },
  productId: {
    type: DataTypes.UUID,
    references: {
      model: 'Products',
      key: 'id',
    }
  },
});

Request.hasMany(Product, { foreignKey: 'requestId', as: 'products' });
Product.belongsTo(Request, { foreignKey: 'requestId', as: 'request' });
Product.hasMany(Image, { foreignKey: 'productId', as: 'images' });
Image.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = { Request, Product, Image, sequelize };
