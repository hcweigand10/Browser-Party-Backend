const { User } = require('../models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');


const getUserFriends = async (userId) => {
  const friendsArr = User.aggregate([
    {
      $unwind: '$friends',
    },
    {
      $match:{_id:ObjectId(userId)}
    },
  ]);
  return friendsArr;
}

module.exports = {
  // Get all users
  getUsers(req, res) {
    User.find()
      .then(async (users) => {
        const userObj = {
          users,
        };
        return res.json(userObj);
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json(err);
      });
  },
  // Get a single user
  getSingleUser(req, res) {
    User.findOne({ _id: req.params.userId })
      .select('-__v')
      .then(async (user) =>
        !user
          ? res.status(404).json({ message: 'No user with that ID' })
          : res.json({
              user,
              friends: await getUserFriends(req.params.userId),
            })
      )
      .catch((err) => {
        console.log(err);
        return res.status(500).json(err);
      });
  },

  // Update a single user
  updateUser(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $set: req.body },
      { runValidators: true, new: true }
    )
      .then((user) =>
        !user
          ? res.status(404).json({ message: 'No user with this id!' })
          : res.json(user)
      )
      .catch((err) => res.status(500).json(err));
  },

  // create a new user
  async createUser(req, res) {
    try {
      const newUser = await User.create({
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password, 4),
        friends: []
      });
      res.status(200).json(newUser);
    } catch (error) {
      res.status(500).json(error)
    }
  },

  // Delete a user and remove them from the course
  deleteUser(req, res) {
    User.findOneAndRemove({ _id: req.params.userId })
      .then((user) =>
        !user
          ? res.status(404).json({ message: 'No such user exists' })
          : res.status(404).json({ message: 'Deleted!' })
      )
      .catch((err) => {
        console.log(err);
        res.status(500).json(err);
      });
  },

  // Add an friend to a user
  addFriend(req, res) {
    console.log('You are adding a friend');
    console.log(req.body);
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $addToSet: { friend: req.body } },
      { runValidators: true, new: true }
    )
      .then((user) =>
        !user
          ? res
              .status(404)
              .json({ message: 'No user found with that ID :(' })
          : res.json(user)
      )
      .catch((err) => res.status(500).json(err));
  },
  // Remove friend from a user
  removeFriend(req, res) {
    User.findOneAndUpdate(
      { _id: req.params.userId },
      { $pull: { friend: { friendId: req.params.friendId } } },
      { runValidators: true, new: true }
    )
      .then((user) =>
        !user
          ? res
              .status(404)
              .json({ message: 'No user found with that ID :(' })
          : res.json(user)
      )
      .catch((err) => res.status(500).json(err));
  },

  // login attempt
  async login(req, res) {
    try {
      // we search the DB for a user with the provided username
      const userData = await User.findOne({username: req.body.username });
      if (!userData) {
        // the error message shouldn't specify if the login failed because of wrong username or password
        res.status(404).json({ message: 'Login failed. Please try again!' });
        return;
      }
      // use `bcrypt.compare()` to compare the provided password and the hashed password
      const validPassword = await bcrypt.compare(
        req.body.password,
        userData.password
      );
      // if they do not match, return error message
      if (!validPassword) {
        res.status(400).json({ message: 'Login failed. Please try again!' });
        return;
      }
      // if they do match, return success message
      res.status(200).json({ message: 'You are now logged in!' });
    } catch (err) {
      res.status(500).json(err);
    }
  },

};
