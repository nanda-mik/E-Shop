const User = require('../models/user');
const getDb = require('../util/database').getDb;
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
  // console.log(req.get('Cookie').split('=')[1]);
  // console.log(req.user);
  // console.log(req.session.isLoggedIn);
    res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false
    });
  };

exports.postLogin = (req,res,next) => {
  const email = req.body.email;
  const password = req.body.password;
  const db = getDb();
  db.collection('users').findOne({email: email})
    .then(user => {
      if(!user){
        return res.redirect('/login');
      }
      bcrypt.compare(password,user.password)
      .then(doMatch => {
        if(doMatch){
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
          // console.log(err);
          res.redirect('/');
          });
        }
        res.redirect('/login');
      })
      .catch(err => {
        console.log(err);
        res.redirect('/login');
      })
    })
    .catch(err=>console.log(err));
};

exports.postLogout = (req,res,next) => {
  req.session.destroy(err =>{
      // console.log(err);
      res.redirect('/');
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const comfirmPassword = req.body.comfirmPassword;
  const db= getDb();
  db.collection('users').findOne({email: email})
  .then(userDoc => {
    if(userDoc){
      return res.redirect('/signup');
    }
    return bcrypt.hash(password,12)
    .then(hashedpass =>{
      const user = new User(email,hashedpass);
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
    });
  })
  .catch(err=>console.log(err));
};