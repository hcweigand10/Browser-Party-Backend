const { User } = require('../models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");


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

  login (req, res) {
    console.log(`login attempt for ${req.body.username}`)
    User.findOne({username:req.body.username}).then(dbUser=>{
        if(!dbUser){
            return res.status(403).json({err:"invalid credentials"})
        } 
        if (bcrypt.compareSync(req.body.password,dbUser.password)) {
            const token = jwt.sign(
              {
                username: dbUser.username,
                id: dbUser.id
              },
              // LOCAL:
              "spenceriscute",

              // DELPOYED:
              // process.env.JWT_SECRET,
              {
                expiresIn: "6h"
              }
            );
            res.json({ 
                token: token, 
                user: dbUser
            });
          } else {
            res.status(403).json({err: "invalid credentials"});
          }
    }).catch(err=>{
        console.log(err)
        res.status(500).json({msg:"an error occured",err})
    })
  },
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
      console.log(`newUser: ${newUser}`)
      res.status(200).json(newUser);
    } catch (error) {
      console.log(error)
      res.status(500).json(error)
    }
  },

  // Delete a user and remove them from the course
  deleteUser(req, res) {
    User.findOneAndRemove({ _id: req.params.userId })
      .then((user) =>
        !user
          ? res.status(404).json({ message: 'No such user exists' })
          : res.status(200).json({ message: 'Deleted!' })
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

  getTokenData(req, res) {
    const token = req.headers?.authorization?.split(" ").pop();
    jwt.verify(token, "spenceriscute", (err, data) => {
      if (err) {
        console.log(err);
        const data = {
          err: "Token has expired"
        }
        res.status(403).json(data);
      } else {
        User.findOne({_id:data.id}).then(userData=>{
          console.log(userData)  
          res.json(userData);
        })
      }
    });
  },

};
