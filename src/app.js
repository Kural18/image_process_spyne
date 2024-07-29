const express = require('express');
const imageRoutes = require('./routes/image_routes');

const app = express();


app.use(express.json());
app.use('/images', imageRoutes);

module.exports = app;
