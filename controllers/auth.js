const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  // console.log(req.get('Cookie').split('=')[1]);
  console.log(req.user);
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
      req.user = user;
      req.session.save(err => {
        console.log(err);
        res.redirect('/');
      });
      // before we used to work with req.user which returns a object
      //hence all function works perfectly although in datbase user 
      //object is stored it is a data not in the form of object.
  })
  .catch(err => console.log(err));
};

exports.postLogout = (req,res,next) => {
  req.session.destroy(err =>{
      console.log(err);
      res.redirect('/');
  });
};