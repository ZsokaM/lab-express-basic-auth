const mongoose = require('mongoose');
const { Router } = require('express');
const router = new Router();
const bcryptjs = require('bcryptjs');
const saltRounds = 10;
const User = require('../models/User.model');

router.get('/signup', (req, res) => {
  res.render('auth/signup')
});

router.post('/signup', (req, res, next) => {
  const { username, email, password } = req.body;
 
  if (!username || !email || !password) {
    res.render('auth/signup', { errorMessage: 'All fields are mandatory. Please provide your username, email and password.' });
    return;
  }

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res
      .status(500)
      .render('auth/signup', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
    return;
  }
  
  bcryptjs
    .genSalt(saltRounds) 
    .then(salt => bcryptjs.hash(password, salt)) 
    .then(hashedPassword => {
      return User.create({
        username,
        email,
        passwordHash: hashedPassword
      });
    })
    .then(userFromDB => {
      res.redirect('/userProfile');
    })
    .catch(error => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render('auth/signup', { errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(500).render('auth/signup', {
           errorMessage: 'Username and email need to be unique. Either username or email is already used.'
        });
      } else {
        next(error);
      }
    });
});

router.get('/login', (req, res) => res.render('auth/login'));

router.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Please enter both, email and password to login.'
    });
    return;
  }
 
  User.findOne({ email })
    .then(user => {
      if (!user) {
        res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.' });
        return;
      } else if (bcryptjs.compareSync(password, user.passwordHash)) {
        req.session.currentUser = user;
        console.log(req.session)
        console.log(`here the currentUser is visible: ${req.session.currentUser}`)
        res.redirect('/userProfile');
      } else {
        res.render('auth/login', { errorMessage: 'Incorrect password.' });
      }
    })
    .catch(error => next(error));
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.get('/userProfile', (req, res) => {
  console.log(`here the currentUser is NOT visible: ${req.session.currentUser}`)
  res.render('users/user-profile', { userInSession: req.session.currentUser });
});

router.get('/main', (req, res)=>{
  const user = req.session.currentUser
  if(!user){
      res.redirect("/login")
  }
  res.render('other/main')
})

router.get('/private', (req, res)=>{
  const user = req.session.currentUser
  if(!user){
      res.redirect("/login")
  }
  res.render('other/private')
})

module.exports = router;