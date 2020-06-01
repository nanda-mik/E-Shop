const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const User = require('../models/user');
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Validator = require("validator");
const isEmpty = require("is-empty");
const crypto = require('crypto');
dotenv.config();

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: process.env.API_KEY
  }
}));

exports.getLogin = (req, res, next) => {
  // console.log(req.get('Cookie').split('=')[1]);
  // console.log(req.user);
  // console.log(req.session.isLoggedIn);
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  }else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.postLogin = (req,res,next) => {
  const email = req.body.email;
  const password = req.body.password;
  const db = getDb();
  
  req.body.email = !isEmpty(req.body.email) ? req.body.email : "";
  req.body.password = !isEmpty(req.body.password) ? req.body.password : "";

  if (Validator.isEmpty(req.body.email)) {
    req.flash('error', 'Email field is required');
    return res.redirect('/login');
  }

  if (Validator.isEmpty(req.body.password)) {
    req.flash('error', 'Password field is required');
    return res.redirect('/login');
  }

  db.collection('users').findOne({email: email})
    .then(user => {
      if(!user){
        req.flash('error','Invalid email or password');
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
        req.flash('error', 'Invalid email or password.');
        res.redirect('/login');
      })
      .catch(err => {
        console.log(err);
        res.redirect('/login');
      })
    })
    .catch(err=>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.postLogout = (req,res,next) => {
  req.session.destroy(err =>{
      // console.log(err);
      res.redirect('/');
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  }else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const db= getDb();

  req.body.email = !isEmpty(req.body.email) ? req.body.email : "";
  req.body.password = !isEmpty(req.body.password) ? req.body.password : "";
  req.body.confirmPassword = !isEmpty(req.body.confirmPassword) ? req.body.confirmPassword : "";

  if (Validator.isEmpty(req.body.email)) {
    req.flash('error', 'Email field is required');
    return res.redirect('/signup');
  }else if(!Validator.isEmail(req.body.email)){
    req.flash('error', 'Invalid Email address');
    return res.redirect('/signup');
  }else if (Validator.isEmpty(req.body.password)) {
    req.flash('error', 'Password field is required');
    return res.redirect('/signup');
  }else if (Validator.isEmpty(req.body.confirmPassword)) {
    req.flash('error', 'confirm Password field is required');
    return res.redirect('/signup');
  }else{

  db.collection('users').findOne({email: email})
  .then(userDoc => {
    if(userDoc){
      req.flash('error', 'E-Mail exists already, please pick a different one.');
      return res.redirect('/signup');
    }
    else if(password !== confirmPassword){
      req.flash('error', 'Password and confirm password must be same');
      return res.redirect('/signup');
    }

    return bcrypt.hash(password,12)
    .then(hashedpass =>{
      let cart = {items:[]};
      const user = new User(email,hashedpass,cart);
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
      return transporter.sendMail({
        to: email,
        from: 'b518045@iiit-bh.ac.in',
        subject: 'e-Dokan Signup successful',
        html: '<h1>You successfully signed up!</h1><p>Hope, you enjoy shopping with us.</p>'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
  })
  .catch(err=>{
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
}
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  const db = getDb();
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    db.collection('users').findOne({ email: req.body.email })
      .then(user => {
        if (!user) {  
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        // console.log(user._id);
        return db.collection('users').update(
          {'_id' : new mongodb.ObjectId(user._id)},
          { '$set' : {
            'resetToken': token,
            'resetTokenExpiration': Date.now() + 600000
          }}
          )
        // db.users.aggregate([
        //   {
        //     $addFields: {
        //       resetToken: token,
        //       resetTokenExpiration = Date.now() + 600000
        //     }
        //   }
        // ])
        // user.resetToken = token;
        // user.resetTokenExpiration = Date.now() + 3600000;
        // return user.save();
      })
      .then(result => {
        res.redirect('/login');
        transporter.sendMail({
          to: req.body.email,
          from: 'b518045@iiit-bh.ac.in',
          subject: 'Password reset',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
  
      });
  });
};


exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  const db = getDb();
  db.collection('users').findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  const db = getDb();

  db.collection('users').findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      return db.collection('users').update(
        {'_id' : new mongodb.ObjectId(userId)},
        { '$set' : {
          'password' : hashedPassword,
          'resetToken': undefined,
          'resetTokenExpiration': undefined
        }}
      )
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};