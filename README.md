# E-Shop

* features:
  * Node provides the backend environment for this application
  * Express middleware is used to handle requests, routes
  * MySQL for CRUD operations only(available in older commits)
  * MongoDB for database management
  * Ejs template to handle frontend html views with dynamic js
  * Stripe API is used for payment 
  * Sendgrid for email verification 
  * pdfKit for generating pdf
  
  Some basic Git commands are:

```
$ git clone https://github.com/nanda-mik/E-Shop.git
$ cd project
$ npm install

```
## Setup

```
> Create .env file that include:
  * PORT & MONGO_URI
  * SECRET_KEY => secret key for Stripe API
  * API_KEY => api key from sendgrid

```

## Run the application for development

```
$ npm start

```

## Languages & tools

- [Node](https://nodejs.org/en/)

- [Express](https://expressjs.com/)

- [EJS](https://ejs.co/)

- [MongoDB](https://www.mongodb.com/)

- [Stripe](https://stripe.com/docs)

- [pdfKit](https://pdfkit.org/)

- [Sendgrid](https://sendgrid.com/docs/)

