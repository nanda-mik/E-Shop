const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class User{
  constructor(username, email){
    this.name = username;
    this.email= email;
  }

  save(){
    const db = getDb();
    return db.collection('users').insertOne(this);
  }

  static findById(userId){
    const db = getDb();
    return db.collection('users').findOne({_id: new mongodb.ObjectId(userId)})
    .then(user => {
      console.log(user);
      return user;
    })
    .catch(err => console.log(err));
    // use find().next() and findOne() for one user only. same meaning find().next() returns a cursir pointing to that id but findOne() ives the object .
  }
}

module.exports = User;
