const router = require('express').Router();
const {login, getTokenData} = require('../controllers/userController')
// const {login, logout} = require('../../controllers/userController')


// /login
router.route('/login').post(login);

router.route('/gettokendata').post(getTokenData);

// /logout
// router.route('/').post(logout);

module.exports = router;