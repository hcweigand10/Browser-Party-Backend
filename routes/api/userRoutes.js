const router = require('express').Router();
const {
    getUsers,
    createUser,
    getSingleUser,
    deleteUser,
    addFriend,
    removeFriend,
} = require('../../controllers/userController');
const mysql = require('mysql2');

// /api/users
router.route('/').get(getUsers).post(createUser);

// /api/users/:username
router.route('/:username').get(getSingleUser).delete(deleteUser);

// /api/users/:username/friends
router.route('/:username/friends').post(addFriend);

// /api/users/:username/friends/:freindUsername
router.route('/:username/friends/:freindUsername').delete(removeFriend);

module.exports = router;
