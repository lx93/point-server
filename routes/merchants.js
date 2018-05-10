const express = require('express');
const mController = require('../controllers/merchants');
const bController = require('../controllers/balances');
const merchantAuth = require('../middleware/merchantAuth');
const merchantExist = require('../middleware/merchantExist');

//localhost:3000/merchants
const router = express.Router();

//Merchants

//Get info
router.get('/', merchantAuth, merchantExist, mController.getMerchant);

//SignUp
router.post('/signup', mController.signUp);

//LogIn
router.post('/login', mController.logIn);

//Update
router.put('/', merchantAuth, merchantExist, mController.update);

//DeleteMerchant
router.delete('/', merchantAuth, merchantExist, mController.deleteMerchant, bController.merchantDelete);


//Balances

//Get Balances
router.get('/balances', merchantAuth, merchantExist, bController.merchantGet);
router.get('/balances/:balanceId', merchantAuth, merchantExist, bController.merchantGetOne);

//Create Balance
router.post('/balances', merchantAuth, merchantExist, bController.merchantCreate);

//Delete Balance
router.delete('/balances/:balanceId', merchantAuth, merchantExist, bController.merchantDeleteOne);


module.exports = router;
