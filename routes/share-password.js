var express = require('express');
var router = express.Router();
var userModule = require('../modules/user');
var passCatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

function checkLoginUser(req, res, next) {
  var userToken = localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
  } catch (err) {
    res.redirect('/');
  }
  next();
}

router.route('/:id')
.get(checkLoginUser , function (req, res, next) {

    res.render('share-password', {
        poll_id: req.params.id,
        msg: "Please enter the username of the Person You would like to share this password with.",
        title: "Password Management System"
    });
  })
  .post(checkLoginUser, function (req, res, next) {
    const  id  = req.body.poll_id;
    const user_name = req.body.username;

    console.log("The poll id is", id);

    console.log(user_name);

    const user_temp = findUser(user_name);
    user_temp.then(response => {
        if(response == null){
          res.render('share-password', {
            poll_id: id,
            msg: "Please enter the correct username",
            title: "Password Management System"
        })

        }
        else{
        console.log("The returned user is ===", response);
        console.log("The user array is", response.passwords);
        
        response.passwords.push(id);

        console.log("the changed user is", response);

        savePassInUser(response).then(response1 => {
            res.redirect('/view-all-password');
        })
        }
        
    }).catch(error => console.log("Something unexpected happened", error))
})



async function findUser(decoded){
    try {
      const user = await userModule.findOne({username: decoded})
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