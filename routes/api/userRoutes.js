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
router.route('/:userId').get(getSingleUser).delete(deleteUser);

// /api/users/:userId/friends
router.route('/:userId/friends').post(addFriend);

// /api/users/:userId/friends/:friendId
router.route('/:userId/friends/:friendId').delete(removeFriend);

module.exports = router;
