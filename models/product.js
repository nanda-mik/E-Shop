const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class Product{
  constructor(title, price, description, imageUrl, id, userId){
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectID(id) : null;
    this.userId = userId;
  }

  save(){
    const db = getDb();
    let dbOp;
    if(this._id){
      dbOp =db.collection('products').updateOne({_id: this._id}, {$set: this});
    }else{
      dbOp = db.collection('products')
      .insertOne(this)
    }
    return dbOp
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
    });
  }

  static fetchAll(){
    const db = getDb();
    return db.collection('products').find().toArray()
    .then(products => {
      // console.log(products);
      return products;
    })
    .catch(err => {
      console.log(err);
    });
    //find doesn't return a promise it return a cursor,
    //an object provided by mongodb which allows us to go through our elements, our documents step by step.
  }
  static findProduct(id){
    const db = getDb();
    return db.collection('products').find({userId : id}).toArray()
    .then(products => {
      return products;
    })
    .catch(err => console.log(err));
  }

  static findById(prodId){
    const db = getDb();
    return db.collection('products')
    .find({ _id:new mongodb.ObjectId(prodId )})
    .next()
    .then(product => {
      console.log(product);
      return product;
    })
    .catch(err => {
      console.log(err);
    });
  }
  static deleteById(prodId, id){
    const db = getDb();
    return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId), userId : id})
    .then(result => {
      console.log('Deleted');
    })
    .catch(err =>{
      console.log(err);
    });
  }

}

module.exports = Product;