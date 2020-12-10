var express = require('express');
var router = express.Router();
var userModule = require('../modules/user');
var passCatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
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

router.get('/', checkLoginUser, function (req, res, next) {
    var loginUser = localStorage.getItem('loginUser');
    getPassCat.exec(function (err, data) {
      if (err) throw err;
      res.render('add-new-password', {
        title: 'Password Management System',
        loginUser: loginUser,
        records: data,
        success: '',
      });
    });
  });
  
  router.post('/', checkLoginUser, function (req, res, next) {
    var loginUser = localStorage.getItem('loginUser');


    const decoded = req.decoded;
    
      
    const user_temp = findUser(decoded);
    //async function return a promise
    //use then to handle the promises

    user_temp.then(response => {
      console.log("The returned user is ===", response);
      var pass_cat = req.body.pass_cat;
    var project_name = req.body.project_name;
    var pass_details = req.body.pass_details;
    var password_details = new passModel({
      password_category: pass_cat,
      project_name: project_name,
      password_detail: pass_details,
    });

    //save to user data as well 
    // user_temp.passwords.push(password_details._id);
    
    // user_temp.passwords.push(1)
    console.log("The passwords filed of user is = =", response.passwords);

    response.passwords.push(password_details._id);
    //
    savePassInUser(response).then(response1 => {


      password_details.save(function (err, doc) {
        getPassCat.exec(function (err, data) {
          if (err) throw err;
          res.render('add-new-password', {
            title: 'Password Management System',
            loginUser: loginUser,
            records: data,
            success: 'Password Details Inserted Successfully',
          });
        });
      });


    })
    








    //

  

  });

    })
    
    



    

async function findUser(decoded){
  try {
    const user = await userModule.findById(decoded.userId);
    console.log("The user is ==", user, 'and the decoded is ==', decoded);
    return user;
    
  } catch (error) {
    console.log("Error Occured in finding the User");
    
  }
}

async function savePassInUser(user_temp){
  try {
    await user_temp.save();
    console.log("Saving Pass in User");
    
  } catch (error) {
    console.log("Error Occured in Saving  the password in User", error);
    
  }
  

}

  module.exports = router;