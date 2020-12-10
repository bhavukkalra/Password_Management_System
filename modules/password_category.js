const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set("debug", true);

mongoose.set('useFindAndModify', false);
var conn = mongoose.Collection;
var passcatSchema =new mongoose.Schema({
  passord_category: {type:String, 
      required: true,
      index: {
          unique: true,        
      }},

  date:{
      type: Date, 
      default: Date.now }
});

var passCateModel = mongoose.model('password_categories', passcatSchema);
module.exports=passCateModel;