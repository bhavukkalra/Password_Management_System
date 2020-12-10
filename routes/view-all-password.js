var express = require('express');
var router = express.Router();
var userModule = require('../modules/user');
var passCatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { response } = require('express');
var getPassCat = passCatModel.find({});
var getAllPass = passModel.find({});

/* GET home page. */

function checkLoginUser(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
    req.decoded = decoded;
  } catch (err) {
    res.redirect('/');
  }
  next();
}

if (typeof localStorage === 'undefined' || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

function checkEmail(req, res, next) {
  var email = req.body.email;
  var checkexitemail = userModule.findOne({ email: email });
  checkexitemail.exec((err, data) => {
    if (err) throw err;

    if (data) {
      return res.render('signup', {
        title: 'Password Management System',
        msg: 'Email already exists',
      });
    }
    next();
  });
}

function checkUsername(req, res, next) {
  var uname = req.body.uname;
  var checkexituname = userModule.findOne({ username: uname });
  checkexituname.exec((err, data) => {
    if (err) throw err;
    if (data) {
      return res.render('signup', {
        title: 'Password Management System',
        msg: 'Username already exists',
      });
    }
    next();
  });
}


// router.get('/', checkLoginUser, function (req, res, next) {
//   var loginUser = localStorage.getItem('loginUser');
//   var perPage = 3;
//   var page =  1;

//   getAllPass
//     .skip(perPage * page - perPage)
//     .limit(perPage)
//     .exec(function (err, data) {
//       if (err) throw err;
//       passModel.countDocuments({}).exec((err, count) => {
//         res.render('view-all-password', {
//           title: 'Password Management System',
//           loginUser: loginUser,
//           records: data,
//           current: page,
//           pages: Math.ceil(count / perPage),
//         });
//       });
//     });
// });

// router.get('/:page', checkLoginUser, function (req, res, next) {
//   var loginUser = localStorage.getItem('loginUser');
//   var perPage = 3;
//   var page = req.params.page || 1;

//   getAllPass
//     .skip(perPage * page - perPage)
//     .limit(perPage)
//     .exec(function (err, data) {
//       if (err) throw err;
//       passModel.countDocuments({}).exec((err, count) => {
//         res.render('view-all-password', {
//           title: 'Password Management System',
//           loginUser: loginUser,
//           records: data,
//           current: page,
//           pages: Math.ceil(count / perPage),
//         });
//       });
//     });
// });

//WORKING STATE

router.get('/', checkLoginUser, function (req, res, next) {
    var loginUser = localStorage.getItem('loginUser');
    let userId = req.decoded.userId;
    console.log("the login id of user is", userId);
    var options = {
      offset:   1, 
      limit:    3
  };

  //get all user specific pass

  getPassOfUser(userId).then(response => {
    console.log("The returned object is ==", response);



    passModel.paginate({},options).then(function(result){
      console.log('This is test====',result);
      //objects are given like this
    //   docs: [
    //     {
    //       _id: 5fb3828b4ca7e206ed195ee1,
    //       password_category: 'Youtube',
    //       project_name: 'Password',
    //       password_detail: 'This is mine',
    //       date: 2020-11-17T07:58:03.291Z,
    //       __v: 0
    //     }
    //   ],
    //   total: 2,
    //   limit: 3,
    //   offset: 1
    // }

    //response.passwords
        res.render('view-all-password', {
          title: 'Password Management System',
          loginUser: loginUser,
          records: response.passwords,
          current: result.offset,
          pages:  Math.ceil(response.passwords.length / 10),
          //result.limit = 10(forced)
        });
    });

  })


  

  });
  
  router.get('/:page', checkLoginUser, function (req, res, next) {
    var loginUser = localStorage.getItem('loginUser');
    var perPage = 10;
    var page = req.params.page || 1;
  
    getAllPass
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec(function (err, data) {
        if (err) throw err;
        passModel.countDocuments({}).exec((err, count) => {
          res.render('view-all-password', {
            title: 'Password Management System',
            loginUser: loginUser,
            records: data,
            current: page,
            pages: Math.ceil(count / perPage),
          });
        });
      });
  });

  async function getPassOfUser(userId){
    try {
      const user = await userModule.findById(userId).populate('passwords');
      console.log("Populated Pass's are==", user);

      return user;
      
    } catch (error) {
      console.log("Failed to get user specific pass's")
      
    }
  }
  

  module.exports = router;