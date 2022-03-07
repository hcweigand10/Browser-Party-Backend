const { Schema, model } = require('mongoose');

// Schema to create Student model
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      max_length: 50,
      unique: true
    },
    password: {
      type: String,
      required: true,
      min_length: 7,
      max_length: 14
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: this,
      },
    ],
    wins: {
      type: Number,
      default: 0
    }
  },
  {
    toJSON: {
      getters: true,
    },
  }
);

userSchema
  .virtual('friendCount')
  .get(function() {
    return this.friends.length
  })

const User = model('user', userSchema);

module.exports = User;
