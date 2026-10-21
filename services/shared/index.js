const User = require('./src/models/user');
const ConnectionRequest = require('./src/models/connectionRequest');
const Chat = require('./src/models/chat');
const Message = require('./src/models/message');
const Payment = require('./src/models/payment');

const dbConnect = require('./src/config/dbConnect');
const redisConfig = require('./src/config/redis');
const kafkaConfig = require('./src/config/kafka');

const mongoose = require("mongoose");

module.exports = {
  mongoose,
  models: {
    User,
    ConnectionRequest,
    Chat,
    Message,
    Payment
  },
  config: {
    dbConnect,
    redis: redisConfig,
    kafka: kafkaConfig
  }
};
