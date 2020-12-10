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
const bodyParser = require('body-parser')
const nunjucks = require('nunjucks')
const Nexmo = require('nexmo');
const { route } = require('./dashboard');
const json = require('json');
require("dotenv").config({path: __dirname+  '/./../.env'});


const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const nexmo = new Nexmo({ 
  apiKey: API_KEY,
  apiSecret: API_SECRET
})

function checkLoginUser(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
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

router.get('/', function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    res.redirect('./dashboard');
  } else res.render('index', { title: 'Password Management System', msg: '' });
});

router.post('/', function (req, res, next) {
  localStorage.clear();
  var username = req.body.uname;
  var password = req.body.password;
  //FOR FUTURE ROUTES
  localStorage.setItem('temp_uname', username);

  var checkUser = userModule.findOne({ username: username });
  // console.log("The user is ==", checkUser);
  checkUser.exec((err, data) => {
    if (err){
      console.log('error is triggerred and error is', err)
      res.render('index', {
        title: 'Password Management System',
        msg: 'Invalid Username/Password',
      });
      
    }
    else if(data == null){
      res.render('index', {
        title: 'Password Management System',
        msg: 'Invalid Username/Password',
      });
      
    }
    
    else{
      console.log('this is data element', data);
      // console.log('this is error', err);
      console.log('this is mobile', data.mobile);
    try {
      
      
      var getUserID = data._id;
      var getPassword = data.password;
    if (bcrypt.compareSync(password, getPassword)) {
      localStorage.setItem('temp_userID', getUserID);

      //user is verified of login and password
      nexmo.verify.request({
        number: data.mobile,
        
        brand: 'ACME Corp',
        workflow_id: 6
      }, (error, result) => {
        if(result.status != 0) {

          res.render('index', { msg: result.error_text, title: "Password Management System"});
        } else {

          
          res.render('check-signin', { requestId: result.request_id, message: `a OTP has been sent to ${data.mobile}`, title: "Password Management System" })
        }
      });

    } else {
      res.render('index', {
        title: 'Password Management System',
        msg: 'Invalid Username/Password',
      });
    }
      
    } catch (error) {
      res.render('index', {
        title: 'Password Management System',
        msg: 'Invalid Username/Password and error occured bitch',
      });  
    }

    }
  });
});

router.post('/check-signin', function (req, res, next){


  nexmo.verify.check({
    request_id: req.body.requestId,
    code: req.body.code
  }, (error, result) => {
    
    console.log('Correct uptil here=======');
    if(result.status != 0) {
      res.render('index', { msg: 'Incorrect code entered, Please Wait for few minutes before trying again', title: "Password Management system" })
    } else {
      //user login and code entered successfully

      var token = jwt.sign({ userId: localStorage.getItem('temp_userID') }, 'loginToken');
      localStorage.setItem('userToken', token);
      localStorage.setItem('loginUser', localStorage.getItem('temp_uname'));
      res.redirect('/dashboard');

    }
  })
})


router.get('/signup', function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    res.redirect('./dashboard');
  } else res.render('signup', { title: 'Password Management System', msg: '' });
});

router.post('/signup', checkUsername, checkEmail, function (req, res, next) {
  let username = req.body.uname;
  let email = req.body.email;
  let password = req.body.password;
  let confpassword = req.body.confpassword;
  if (password != confpassword) {
    res.render('signup', {
      title: 'Password Management System',
      msg: 'Password does not match',
    });
  } else {
    // DO TWO FACTOR AUTH AND ASK FOR PHONE NUMBER TO BE SAVED
    //uname, email ,password
    console.log(username, email, password);
    localStorage.setItem('temp_username', username);
    localStorage.setItem('temp_email', email);
    localStorage.setItem('temp_password', password);
    console.log(localStorage.temp_username);
    res.render('enter_mobile', {message : "Please enter your Mobile number for verification, ", title: "Password Management System"})
  }
});


router.post('/verify', (req, res) => {
  nexmo.verify.request({
    number: req.body.number,
    
    brand: 'ACME Corp',
    workflow_id: 6
  }, (error, result) => {
    if(result.status != 0) {
      res.render('enter_mobile', { message: result.error_text , title: "Password Managament System"})
    } else {
      localStorage.setItem('temp_mobile_number', req.body.number);
      res.render('check', { requestId: result.request_id, message: '', title: "Password Management System" })
    }
  })
});

router.post('/check', (req, res) => {
  nexmo.verify.check({
    request_id: req.body.requestId,
    code: req.body.code
  }, (error, result) => {
    console.log(result, req.body.reques);
    if(result.status != 0) {
      localStorage.removeItem('temp_username');
      localStorage.removeItem('temp_email');
      localStorage.removeItem('temp_password');
      localStorage.removeItem('temp_mobile_number');

      res.render('enter_mobile', { message: result.error_text, title: "Password Managament System"})
    } else {
      console.log(localStorage.temp_mobile_number);

      password = localStorage.temp_password;
      username = localStorage.temp_password;
      mobile = localStorage.temp_mobile_number
      email = localStorage.temp_email

      final_password = bcrypt.hashSync(password, 10);
      var userDetails = new userModule({
      username: username,
      email: email,
      password: final_password,
      mobile: mobile
     });

      console.log('saved user is - ', userDetails, ' and  mobile is - ', userDetails.mobile);

      userDetails.save((err, doc) => {
      if (err) throw err;
      res.render('signup', {
        title: 'Password Management System',
        msg: 'User Registered Successfully',
      });
    });

      
    }
  })
})



router.get('/logout', function (req, res, next) {
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  res.redirect('/');
});
module.exports = router;
