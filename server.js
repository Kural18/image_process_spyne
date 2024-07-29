require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;


sequelize.authenticate()
  .then(() => {
    console.log('Database connected...');
    

    return sequelize.sync(); 
  })
  .then(() => {

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });
