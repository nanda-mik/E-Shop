const Product = require('../models/product');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: null,
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);
  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image.'
    });
  }

  const imageUrl = image.path;
  const product = new Product(title,
    price,
    description,
    imageUrl,
    null,
    req.user._id);
  product.save()
  .then(result => {
    // console.log(result);
    console.log('Created Product');
    res.redirect('/admin/products');
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    // Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        errorMessage:null,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  Product.findById(prodId)
  .then(prod => {
    var imageUrl = prod.imageUrl;
    if(image){
      fileHelper.deleteFile(imageUrl);
      imageUrl = image.path;
    }
    const product = new Product(updatedTitle,updatedPrice,updatedDesc,imageUrl,prodId,req.user._id);
    return product.save();
  })
  .then(result => {
    console.log('UPDATED PRODUCT!');
    res.redirect('/admin/products');
  })
  .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.getProducts = (req, res, next) => {
  const id = req.user._id;
  Product.findProduct(id)
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  const id = req.user._id;
  Product.findById(prodId)
  .then(prod => {
    if(!prod){
      return next(new Error('Product not found.'));
    }
    fileHelper.deleteFile(prod.imageUrl);
    return Product.deleteById(prodId,id);
  })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({message: 'Success!'});
    })
    .catch(err => {
      res.status(500).json({message: 'Deleting product failed.'});

    });
};
