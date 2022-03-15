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

// /api/users/:userId
router.route('/:username').get(getSingleUser).delete(deleteUser);

// /api/users/:userId/friends
// router.route('/:username/friends').post(addFriend);

// /api/users/:userId/friends/:friendId
router.route('/:username/friends/:friend').post(addFriend).delete(removeFriend);

module.exports = router;
