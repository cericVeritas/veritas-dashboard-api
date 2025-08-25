const mongoose = require('mongoose');
   mongoose.connect('mongodb://localhost:27017/veritas', { useNewUrlParser: true, useUnifiedTopology: true })
     .then(() => {
       console.log('Connected!');
       process.exit(0);
     })
     .catch(err => {
       console.error('Connection error:', err);
       process.exit(1);
     });