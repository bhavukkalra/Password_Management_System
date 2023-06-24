var express = require('express');
var router = express.Router();
const userModule = require('../modules/user');
var passCatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const { route } = require('./dashboard');
require("dotenv").config({path: __dirname+  '/./../.env'});

// Twilio credentials
const VERIFICATION_SID = process.env.VERIFICATION_SID;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Import twilio SDK
const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);





if (typeof localStorage === 'undefined' || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}



/*

-----------------SKIP SIGN IN FLOW LOGIC GOES HERE---------------------

 */


// Note - For this to work a username with "test" should already exist in the deployed DB
// Or the further interactions won't work
router.get('/test-user', function (req, res, next) {
  let username = "test";

    console.log("Skip Sign In")
    // Sign with the unique user Id provided by Mongo DB not the username
  var checkUser = userModule.findOne({ username: "test" });
  // console.log("The user is ==", checkUser);
  checkUser.exec((err, data) => {
    if (err){
      console.log('error is triggerred and error is', err)
      res.render('index', {
        title: 'Password Management System',
        msg: "Error occured while quering the DB, Please try the request again",
      });

    }
    else if(data == null){
      res.render('index', {
        title: 'Password Management System',
        msg: 'Test user not configured in the DB. Please add the user with username test',
      });

    }

    else{
      var getUserID = data._id;
      var token = jwt.sign({ userId: getUserID }, 'loginToken');
      localStorage.setItem('userToken', token);
      localStorage.setItem('loginUser', username);
      res.redirect('/dashboard');

    }
  });


});

/*
----------------------SKIP SIGN IN FLOW LOGIC ENDS HERE------------------

 */


/*
------------SIGN IN FLOW ROUTES START HERE--------
*/

// COMPLETE Sign in Flow
router.post('/', function (req, res, next) {
  console.log("Here in sign in ")
  localStorage.clear();
  let username = req.body.uname;
  let password = req.body.password;
  console.log("Entered username = ", username)
  console.log("Entered password = ", password)

  //FOR FUTURE ROUTES
  localStorage.setItem('temp_uname', username);
  console.log("Handling future routes, flow shouldn't come here")
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
      console.log('this is error', err);
      console.log("Found the input sign in user in the DB")
      console.log('this is mobile', data.mobile);
      try {


        var getUserID = data._id;
        var getPassword = data.password;
        if (bcrypt.compareSync(password, getPassword)) {
          localStorage.setItem('temp_userID', getUserID);

          let responseOTPRequest = sendOTPRequest(data.mobile);


          responseOTPRequest.then((responseOTPRequestObject) => {

            if(responseOTPRequestObject != "pending"){
              res.render('index', { msg: "Error occured in sending OTP request, Please try again with the login", title: "Password Management System"});
            }else{

              console.log("Sending this registered Mobile to be checked - ", data.mobile)
              res.render('check-signin', { alertDivStatus: "hidden", message: `an OTP has been sent to ${data.mobile}`, title: "Password Management System", registeredMobile: data.mobile });
            }

          })

        } else {
          res.render('index', {
            title: 'Password Management System',
            msg: 'Invalid Username/Password',
          });
        }

      } catch (error) {
        res.render('index', {
          title: 'Password Management System',
          msg: 'Invalid Username/Password and error occured',
        });
      }

    }
  });
});


// CHECKS THE INPUT OTP (Gets the input from the check-sign in page)
router.post('/check-signin', function (req, res, next){



  let code = req.body.code;
  let registeredMobileNumber = req.body.registeredMobile;

  console.log("Sign In flow")
  console.log("Input code - ", code)
  console.log("Registered mobile Number  - ", registeredMobileNumber)


  const OTPVerifyResult = verifyOTPRequest(code, registeredMobileNumber);

  OTPVerifyResult.then((OTPVerifyResult) => {

    console.log('Respnse for OTP verify request - ', OTPVerifyResult);
    console.log("OTPVerifyResult", OTPVerifyResult)
    // Do I get a promise here or a string (Study async await then)

    if(OTPVerifyResult == "approved"){

      var token = jwt.sign({ userId: localStorage.getItem('temp_userID') }, 'loginToken');
      localStorage.setItem('userToken', token);
      localStorage.setItem('loginUser', localStorage.getItem('temp_uname'));
      res.redirect('/dashboard');

    }else{
      console.log("Wrong OTP")


      res.render('check-signin', { alertDivStatus: "", message: `Wrong OTP entered, Please enter the correct OTP`, title: "Password Management System", registeredMobile: registeredMobileNumber });

    }

  })
});



/*

----------SIGN IN FLOW ROUTES ENDS HERE------------

 */


/*
-------------SIGN UP FLOW ROUTES STARTS HERE------------------
*/


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
    // DO 2-Factor AUTH AND ASK FOR PHONE NUMBER TO BE SAVED
    //uname, email ,password
    console.log(username, email, password);
    localStorage.setItem('temp_username', username);
    localStorage.setItem('temp_email', email);
    localStorage.setItem('temp_password', password);
    console.log(localStorage.temp_username);
    res.render('enter_mobile', {message : "Please enter your Mobile number for verification, ", title: "Password Management System"})
  }
});

// INITIATES THE OTP REQUEST (called from enter-mobile ejs page with input as phone-number)
router.post('/verify', (req, res) => {


  let input_mobile = req.body.number;

  console.log("Input Mobile Number ", req.body.number);

  let responseOTPRequest = sendOTPRequest(input_mobile);

  responseOTPRequest.then((responseObject) => {
    // Why this didn't got console logged
    console.log("Response from sendOTPRequest - ", responseOTPRequest)

    console.log("This should get console logged");
    // Below If statement is definitely not working

    if(responseObject  == "pending"){

      // check.ejs =>
      localStorage.setItem('temp_mobile_number', req.body.number);
      res.render('check', { phoneNumber: req.body.number, message: `Please enter the received OTP on ${req.body.number}`, title: "Password Management System" })

    }else{

      // console.log("the response object - ")
      // enter-mobile.ejs => check.ejs
      console.log("Error occured while sending the request for OTP sending")

      console.log("responseOTPRequest.error", responseObject.error)
      res.render('enter_mobile', { requestId: "1",message: "Error occured while initiating a signUp request, Please enter your mobile number again" , title: "Password Managament System"})

    }

  })
});

// Checks the request after it has been initiated on a number
// (End of sign up flow, If the OTP gets verified => The USER's details are added to the DB)
router.post('/check', (req, res) => {


  let code = req.body.code;
  let phoneNumber = req.body.phoneNumber;


  console.log("Input from check")
  console.log("code - ", code)
  console.log("phoneNumber - ", phoneNumber)


  const OTPVerifyResult = verifyOTPRequest(code, phoneNumber);

  OTPVerifyResult.then((OTPVerifyResult) => {

    console.log('Response for OTP verify request - ', OTPVerifyResult);
    // Do a .then here
    console.log("OTPVerifyResult", OTPVerifyResult)
    // Do I get a promise here or a string (Study async await then)

    if(OTPVerifyResult == "approved"){

      console.log(localStorage.temp_mobile_number);


      // Sign up flow
      let password = localStorage.temp_password;
      let username = localStorage.temp_username;
      let mobile = localStorage.temp_mobile_number;
      let email = localStorage.temp_email

      let final_password = bcrypt.hashSync(password, 10);
      let userDetails = new userModule({
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

    }else{
      console.log("Wrong OTP")

      localStorage.removeItem('temp_username');
      localStorage.removeItem('temp_email');
      localStorage.removeItem('temp_password');
      localStorage.removeItem('temp_mobile_number');
      //
      res.render('check', { message: "Wrong OTP entered, Please try again", title: "Password Managament System", phoneNumber: phoneNumber})


    }

  })

})




/*
------------------SIGN UP FLOW ROUTES ENDS HERE-------------------
*/

/*
--------------HELPER FUNCTIONS START HERE--------------------
*/


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

async function sendOTPRequest(phoneNumber){
  let channel = "sms";

  let verificationRequest;
// .v2.services
  try {
    verificationRequest = await twilio.verify.v2.services(VERIFICATION_SID)
        .verifications
        .create({ to: phoneNumber, channel });

    if(verificationRequest.status == "pending"){
      console.log("Request sent successfully");
      console.log("Returning the pending(Success) response")
      return "pending"
    }else{
      console.log("Request wasn't sent successfully")
      return "failed"
    }
  } catch (e) {
    console.log("Error occured while sending OTP verification initation request", e);
    let errorResponse = {
      error: e,
      statusResult: "failed"
    }
    return errorResponse;
  }
}

async function verifyOTPRequest(OTPCode, phoneNumber){
  try{

    const verificationResult = await twilio.verify.v2.services(VERIFICATION_SID)
        .verificationChecks
        .create({to: phoneNumber, code: OTPCode})


    console.log("verificationResult is always failing consoling- ", verificationResult);

    if(verificationResult.status == "approved"){
      console.log("User verified successfully");
      return "approved"
    }

    console.log("Failed to send the OTP verification request");

    let errorResponse = {
      error: null,
      statusResult: "failed"
    }

    errorResponse.error = "Failed to send the OTP verification request";

    return errorResponse;


  } catch (e){

    console.log("Error occured while sending OTP verification initation request", e);

    let errorResponse = {
      error: null,
      statusResult: "failed"
    }

    errorResponse.error = e;

    return errorResponse;

  }
}

function checkLoginUser(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
  } catch (err) {
    res.redirect('/');
  }
  next();
}


/*
-------------HELPER FUNCTIONS END HERE-----------------------
 */



/*
If user already has a valid sign in token
then redirect to dashboard (don't show the sign in page then)
 */

/*
TODO - Check if the token is valid or not
not just the existence of it, use checkLoginUser above

 */

router.get('/', function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    res.redirect('./dashboard');
  } else res.render('index', { title: 'Password Management System', msg: '' });
});


/*
If user already has a valid sign in token
then redirect to dashboard (Don't show the signup page then)
 */
router.get('/signup', function (req, res, next) {
  var loginUser = localStorage.getItem('loginUser');
  if (loginUser) {
    res.redirect('./dashboard');
  } else res.render('signup', { title: 'Password Management System', msg: '' });
});



/*
HANDLES THE LOGOUT,
 */
router.get('/logout', function (req, res, next) {
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  res.redirect('/');
});
module.exports = router;
