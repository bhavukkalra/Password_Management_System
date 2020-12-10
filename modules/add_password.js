const mongoose = require('mongoose');
//to use asynchronous javascript
mongoose.Promise = global.Promise;
// enable debugging realtime
mongoose.set("debug", true);

const { schema } = require('./user');
var mongoosePaginate = require('mongoose-paginate')

mongoose.set('useFindAndModify', false);
var conn = mongoose.Collection;
var passSchema =new mongoose.Schema({
  password_category: {type:String, 
      required: true,
      },
      project_name: {type:String, 
          required: true,
         },
      password_detail: {type:String, 
          required: true,
         },
         user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'users'
        }, 
  date:{
      type: Date, 
      default: Date.now }
});
passSchema.plugin(mongoosePaginate);
var passModel = mongoose.model('password_details', passSchema);
module.exports=passModel;