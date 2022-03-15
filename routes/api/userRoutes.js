const router = require('express').Router();
const {
    getUsers,
    createUser,
    getSingleUser,
    deleteUser,
    addFriend,
    removeFriend,
    updateUser,
    incrementWins
} = require('../../controllers/userController');
const mysql = require('mysql2');

// /api/users
router.route('/').get(getUsers).post(createUser);

// /api/users/:userId
router.route('/:username').get(getSingleUser).delete(deleteUser).put(updateUser);

// /api/users/:userId/win
router.route('/:username/win').get(incrementWins);

// /api/users/:userId/friends
// router.route('/:username/friends').post(addFriend);

// /api/users/:userId/friends/:friendId
router.route('/:username/friends/:friend').post(addFriend).delete(removeFriend);

module.exports = router;
