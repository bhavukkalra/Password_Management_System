const mongoose = require('mongoose');
require("dotenv").config({path: __dirname+  '/./../.env'});

mongoose.Promise = global.Promise;
mongoose.set("debug", true);

const MONGODB_URL = process.env.MONGODB_URL;
async function connectDB() {
  try{
    console.log("Trying connecting");
    const connect = await mongoose.connect(MONGODB_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    });
    console.log('Connected')

  } catch (error) {
    console.log(`DB Connection Error: ${err.message}`)
  }
};
connectDB();
mongoose.set('useFindAndModify', false);
var conn = mongoose.Collection;
var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
  },

  email: {
    type: String,
    required: true,
    index: {
      unique: true,
    },
  },
  password: {
    type: String,
    required: true,
  },
  passwords: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'password_details'
  }],
  date: {
    type: Date,
    default: Date.now,
  },
  mobile:{
    type: String,
    required: true
  }

});

var userModel = mongoose.model('users', userSchema);
module.exports = userModel;
