const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  // console.log(req.get('Cookie').split('=')[1]);
  console.log(req.session.user);
  console.log(req.session.isLoggedIn);
    res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false
    });
  };

exports.postLogin = (req,res,next) => {
  User.findById("5ebcce7741bb359c81c7841d")
  .then(user => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      res.redirect('/');
  })
  .catch(err => console.log(err));
};