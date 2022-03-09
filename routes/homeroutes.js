const router = require('express').Router();
const {login} = require('../controllers/userController')
// const {login, logout} = require('../../controllers/userController')


// /login
router.route('/login').post(login);

// /logout
// router.route('/').post(logout);

module.exports = router;