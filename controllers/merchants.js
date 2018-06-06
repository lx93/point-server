const Merchant = require('../models/merchants');
const Balance = require('../models/balances');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const validator = require('../utils/validator');
const throwErr = require('../utils/throwErr');


//Get Merchant info
//GET api.pointup.io/merchants/
function getMerchant(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      console.log('\n'+merchant+'\n');
      return res.status(200).json({
        name: merchant.name,
        email: merchant.email,
        image: merchant.image,
        merchantId: merchant._id
      });
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Sign up
//POST api.pointup.io/merchants/signup
function signUp(req, res, next) {
  if (!validator.string(req.body.name)) {
    console.log('Invalid name!');
    return res.status(422).json({
      message: "Invalid name!"
    });
  } else if (!validator.email(req.body.email)) {
    console.log('Invalid email!');
    return res.status(422).json({
      message: "Invalid email!"
    });
  } else if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  Merchant.findOne({$or:[{ name: req.body.name }, { email: req.body.email }]})
    .exec()
    .then( merchant => {
      if (!merchant) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            throwErr(res, err);
          }
          var newMerchant = new Merchant({
            _id: new mongoose.Types.ObjectId,
            name: req.body.name,
            email: req.body.email,
            password: hash,
            image: "uploads/Default.png"
          });
          newMerchant
            .save()
            .then( result => {
              console.log('Merchant created!');
              return res.status(201).json({
                message: "Merchant created!"
              });
            })
            .catch( err => {
              throwErr(res, err);
            });
        });
      } else {
        console.log('Merchant exists!');
        return res.status(409).json({
          message: "Merchant exists!"
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Log in
//POST api.pointup.io/merchants/login
function logIn(req, res, next) {
  if (!validator.email(req.body.email)) {
    console.log('Invalid email!');
    return res.status(422).json({
      message: "Invalid email!"
    });
  } else if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  Merchant.findOne({ email: req.body.email })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Auth failed');
        return res.status(401).json({
          message: 'Auth failed'
        });
      } else {
        bcrypt.compare(req.body.password, merchant.password, (err, result) => {
          if (err) {
            throwErr(res, err);
          }
          if (result) {
            const token = jwt.sign(
              {
                name: merchant.name,
                email: merchant.email,
                image: merchant.image,
                merchantId: merchant._id
              },
              process.env.JWT_KEY,
              {
                  expiresIn: "1y"
              }
            );
            console.log('Auth successful');
            return res.status(201).header('Authorization', token).json({
              message: "Auth successful",
              token: token
            });
          }
          console.log('Auth failed');
          return res.status(401).json({
            message: "Auth failed"
          });
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Update name
//PUT api.pointup.io/merchants/name
function updateName(req, res, next) {
  if (!validator.string(req.body.name)) {
    console.log('Invalid name!');
    return res.status(422).json({
      message: "Invalid name!"
    });
  }
  const id = req.merchantData.merchantId;
  Merchant.findOne({ name: req.body.name })
    .exec()
    .then ( merchant => {
      if (!merchant) {
        Merchant.findOneAndUpdate({ _id: id }, {$set:{ name: req.body.name }})
          .exec()
          .then( result => {
            console.log('Name changed!');
            return res.status(201).json({
              message: "Name changed!"
            });
          })
          .catch( err => {
            throwErr(res, err);
          });
      } else {
        console.log('Name already taken!');
        return res.status(201).json({
          message: "Name already taken!"
        });
      }
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Update image
//PUT api.pointup.io/merchants/image
function updateImage(req, res, next) {
  if (!req.file) {
    console.log('Image invalid!');
    return res.status(422).json({
      message: "Image invalid!"
    });
  }
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      fs.stat(merchant.image, (err, stat) => {
        if (!err && merchant.image != 'uploads/Default.png') {
            fs.unlink(merchant.image, (err) => {
              if (err) {
                throwErr(res, err);
              }
            });
        }
      });
      merchant.update({$set:{ image: req.file.path }})
        .exec()
        .then( result => {
          console.log('Image changed!');
          return res.status(201).json({
          message: "Image changed!"
          });
        })
        .catch( err => {
          throwErr(res, err);
        })
    })
    .catch( err => {
      throwErr(res, err);
    });
};

//Update
//PUT api.pointup.io/merchants/password
function updatePassword(req, res, next) {
  if (!validator.string(req.body.password)) {
    console.log('Invalid password!');
    return res.status(422).json({
      message: "Invalid password!"
    });
  }
  const id = req.merchantData.merchantId;
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      throwErr(res, err);
    }
    Merchant.findOneAndUpdate({ _id: id }, { $set:{ password: hash } })
      .exec()
      .then( merchant => {
        console.log('Password changed!');
        return res.status(201).json({
          message: "Password changed!"
        });
      })
      .catch( err => {
        throwErr(res, err);
      });
  });
};

//Delete Merchant
//DELETE api.pointup.io/merchants/
function deleteMerchant(req, res, next) {
  const id = req.merchantData.merchantId;
  Merchant.findOne({ _id: id })
    .exec()
    .then( merchant => {
      if (!merchant) {
        console.log('Merchant doesn\'t exist!');
        return res.status(409).json({
          message: "Merchant doesn't exist!"
        });
      } else {
        fs.stat(merchant.image, (err, stat) => {
          if (!err && merchant.image != 'uploads/Default.png') {
              fs.unlink(merchant.image, (err) => {
                if (err) {
                  throwErr(res, err);
                }
              });
          }
        });
        Merchant.remove({ _id: id })
          .exec()
          .then( result => {
            console.log('Merchant deleted!');
            /*Balance.find({ merchantId: id })
              .exec()
              .then( balance => {
                if (!balance.length) {
                  return res.status(201).json({
                    message: "Merchant deleted!"
                  });
                } else {
                  next();
                }
              })
              .catch( err => {
                throwErr(res, err);
              });*/
            return res.status(201).json({
              message: "Merchant deleted!"
            });
          })
          .catch( err => {
            throwErr(res, err);
          });
      }
    })
    .catch( err => {
      throwErr(res, err);
    })
};

exports.getMerchant = getMerchant;
exports.signUp = signUp;
exports.logIn = logIn;
exports.updateName = updateName;
exports.updateImage = updateImage;
exports.updatePassword = updatePassword;
exports.deleteMerchant = deleteMerchant;
