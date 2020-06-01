const Product = require('../models/product');
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;
const fs = require('fs');
const path = require('path');
const pdfkit = require('pdfkit');
const dotenv = require('dotenv');
dotenv.config();
const stripe = require('stripe')(process.env.SECRET_KEY);


const item_per_page = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  const db = getDb();
  db.collection('products').find()
  .count()
  .then(numProducts => {
    totalItems = numProducts;
    return Product.fetchAll(page);
  })
    .then(products => {
      let lastPage= Math.ceil(totalItems/item_per_page);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: item_per_page*page < totalItems,
        hasPreviousPage: page>1,
        nextPage: page + 1,
        previousPage: page-1,
        hasLeftArrow: (page-1) >0,
        hasRightArrow: (page+1) <= lastPage
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      // console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};
let totalItems;

exports.getIndex = (req, res, next) => {
  // console.log(req.user);
  const page = +req.query.page || 1;
  const db = getDb();
  db.collection('products').find()
  .count()
  .then(numProducts => {
    totalItems = numProducts;
    return Product.fetchAll(page);
  })
    .then(products => {
      let lastPage= Math.ceil(totalItems/item_per_page);
      res.render('shop/index', {
        prods: products,
        pageTitle: 'e-Dokan',
        path: '/',
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: item_per_page*page < totalItems,
        hasPreviousPage: page>1,
        nextPage: page + 1,
        previousPage: page-1,
        hasLeftArrow: (page-1) >0,
        hasRightArrow: (page+1) <= lastPage
      });
    })
    .catch(err => {
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then(products => {
      // console.log(products);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.getCheckout = (req, res, next) => {
  let total;
  let prod;
  req.user
  .getCart()
  .then(products => {
    total =0;
    products.forEach(p => {
      total+=p.quantity * p.price;
    });
    prod = products;
    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map(p => {
        return {
          name: p.title,
          description: p.description,
          amount: p.price,
          currency: 'inr',
          quantity:p.quantity
        };
      }),
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
    });
  })
  .then(session => {
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Checkout',
      products: prod,
      totalSum: total,
      isAuthenticated: req.session.isLoggedIn,
      sessionId: session.id
    });
  })
  .catch(err =>{
    console.log(err);
  });
}

exports.postOrder = (req, res, next) => {
  req.user
    .addOrder()
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders()
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err =>{
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);

    });
};

exports.getInvoice = (req,res,next) => {
  const orderId = req.params.orderId;
  const db = getDb();
  const id = new mongodb.ObjectId(orderId);
  db.collection('orders').findOne({_id:id})
  .then(order => {
    if(!order){
      return next(new Error('No order found'));
    }
    if(order.user._id.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    
    const pdfDoc = new pdfkit();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline: filename="' +invoiceName + '"'
    );
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    });
    pdfDoc.text('-----------------------');
    let totalPrice = 0;
    order.items.forEach(prod => {
      totalPrice += prod.quantity * prod.price;
      pdfDoc
        .fontSize(15)
        .text(
          prod.title +
            ' - ' +
            prod.quantity +
            ' x ' +
            '$' +
            prod.price
        );
    });
    pdfDoc.text('---');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
    
    pdfDoc.end();
    // fs.readFile(invoicePath,(err, data) => {
    //   if(err){
    //     return next(err);
    //   }
    //   res.setHeader('Content-Type','application/pdf');
    //   res.setHeader('Content-Disposition','inline');
    //   res.send(data);
    // })   
    // const file = fs.createReadStream(invoicePath);
    
    // file.pipe(res);
  })
  .catch(err => next(err));
}