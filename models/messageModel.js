const mongoose = require('mongoose')

// Message Model
const message = mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
})

const MessageModel = mongoose.model('Message', message, 'chats')

// Friend-Request Model
const request = mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  username: {
    type: String,
    required: true
  }
})

const FriendRequest = mongoose.model('Request', request, 'chats')

// Contact Model
const contact = mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  messageHost: [
    {
      type: Object
    }
  ],
  messageGuest: [
    {
      type: Object
    }
  ]
})

const ContactModel = mongoose.model('Contact', contact, 'chats')

// Chat Model
const chat = mongoose.Schema({
  refUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contacts: [
    {
      type: Object
    }
  ],
  requests: [
    {
      type: Object
    }
  ],
  requestsSends: [
    {
      type: Object
    }
  ]
})

const ChatModel = mongoose.model('Chat', chat, 'chats')

module.exports = { ChatModel, ContactModel, FriendRequest, MessageModel }
