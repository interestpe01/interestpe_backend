// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");

// const FriendRequest = sequelize.define("FriendRequest", {
//   id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
//   status: { type: DataTypes.ENUM("pending", "accepted", "rejected"), defaultValue: "pending" }
// });

// module.exports = FriendRequest;


// models/FriendRequest.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const FriendRequest = sequelize.define("FriendRequest", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fromUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  toUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "rejected"),
    defaultValue: "pending"
  }
});

module.exports = FriendRequest;
