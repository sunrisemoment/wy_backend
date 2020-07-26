// var eventEmitter = require('./chat.events')

const Call = require('./call.model');
const Chat = require('./chat.model');
const ChatOverview = require('../chatOverview/chatOverview.model');
const User = require('../user/user.model');
const Global = require('../helpers/global');
const FCM = require('fcm-node');
const config = require('../../config/config');
const serverKey = config.fcmKey;


function register(socket) {
  Call.schema.post('save', (doc) => {
    // if(doc.callStatus==-1){

    // }

    console.log(socket.userId, 'socket.userId');
    console.log(doc, 'doc socket.userId');
    socket.emit(`call-${doc.chatId}`, doc);
    return null;
  });

  Chat.schema.post('save', (doc) => {
    socket.emit(`chat-${doc.chatId}`, doc);
    return null;
  });

  ChatOverview.schema.post('save', (doc) => {
    // console.log("Chat SocketData "+doc);
    let chatUser;
    if (socket.userId == doc.userId1) {
      chatUser = doc.userId2;
    } else {
      chatUser = doc.userId1;
    }

    ChatOverview.findChat({ $or: [{ userId1: socket.userId }, { userId2: socket.userId }] }).then((data) => {
      socket.emit('/api/chats', data || []);
      return null;
    });
    // ChatOverview.findChat({ $or: [{ userId1: chatUser }, { userId2: chatUser }] }).then((data) => {
    //   socket.in("/api/chat/" + doc.chatId).emit("/api/chats", data);
    //   return null;
    // });
  });

  socket.on('/api/chat/leave', (dataReq) => {
    console.log(`Leave Room Id${dataReq.chatId}`);
    socket.leave(`/api/chat/${dataReq.chatId}`);
    return null;
  });

  socket.on('/api/chat', (dataReq) => {
    Chat.findChat({ chatId: dataReq.chatId, isActive: true }).then((data) => {
      if (!data) {
        // socket.disconnect();
      }
      socket.room = `/api/chat/${dataReq.chatId}`;
      socket.emit(`/api/chat/${dataReq.chatId}`, data || []);
      socket.join(`/api/chat/${dataReq.chatId}`);

      // console.log(socket);
      return null;
    });
    return null;
  });

  socket.on('/api/chat/post', (dataReq) => {
    const chatId = Global.getChatId(dataReq._id, dataReq.userId2);

    const chat = new Chat({
      chatId,
      message: dataReq.message || null,
      file: dataReq.file || null,
      userId1: dataReq._id,
      userId2: dataReq.userId2,
      messageQuote: (dataReq.messageQuote !== null ? dataReq.messageQuote : ''),
      forwardMessage: (dataReq.forwardMessage === true ? dataReq.forwardMessage : false),
    });

    User.findOne({ _id: dataReq._id, isActive: true }).then((_user) => {
      if (!_user) {
        socket.emit('/api/chat/post', null);
      } else {
        User.findOne({ _id: dataReq.userId2, isActive: true }).then((data) => {
          if (!data) {
            socket.emit('/api/chat/post', null);
          } else {
            chat.save()
              .then((chatdata) => {
                ChatOverview.findOneAndUpdate({ chatId }, { message: dataReq.message, messageQuote: dataReq.messageQuote, forwardMessage: dataReq.forwardMessage, userId1: dataReq._id, userId2: dataReq.userId2, updatedAt: Date.now() }, { upsert: true, new: true }).then(() => null);
                Chat.findIdChat(chatdata._id).then((newdata) => {
                  if (data) {
                    if (data.fcmToken) {
                      const fcm = new FCM(serverKey);
                      const notification = {};

                      notification.title = `${Global.capitalizeFirstLetter(_user.firstName)} ${Global.capitalizeFirstLetter(_user.lastName)} has messaged you`;
                      notification.body = dataReq.message || '';
                      if (dataReq.file) {
                        notification.title = `${Global.capitalizeFirstLetter(_user.firstName)} ${Global.capitalizeFirstLetter(_user.lastName)} has shared you media`;
                        notification.image = dataReq.file;
                        // pushBody = dataReq.file || "";
                      }

                      const message = { // this may vary according to the message type (single recipient, multicast, topic, et cetera)
                        to: data.fcmToken,
                        // collapse_key: 'your_collapse_key',

                        notification,

                        //data: notificationData
                      };

                      fcm.send(message, (err, response) => {
                        if (err) {
                          console.log('Something has gone wrong!');
                        } else {
                          console.log('Successfully sent with response: ', response);
                        }
                        return null;
                      });
                    }
                  } else {
                    console.log('Something has gone wrong with user!');
                  }

                  socket.emit('/api/chat/post', newdata || []);
                  socket.in(`/api/chat/${chatId}`).emit(`/api/chat/${chatId}`, newdata);
                  return null;
                });

                ChatOverview.findChat({ $or: [{ userId1: dataReq._id }, { userId2: dataReq._id }] }).then((data) => {
                  socket.emit('/api/chats', data || []);
                  return null;
                });
                ChatOverview.findChat({ $or: [{ userId1: dataReq.userId2 }, { userId2: dataReq.userId2 }] }).then((data) => {
                  socket.in(`/api/chat/${chatId}`).emit('/api/chats', data);
                  // socket.to("/api/chat/" + chatId).emit("/api/chat/" + chatId,data);
                  return null;
                });
                return null;
              });
          }

          return null;
        });
        return null;
      }
    });

    return null;
  });

  socket.on('/api/chat/typing', (dataReq) => {

    ChatOverview.findOne({ chatId: dataReq.chatId }).then((data) => {
      if (!data) {
        // socket.disconnect();
        socket.emit('/api/chat/typing', []);
        return null;
      }

      if (dataReq._id == data.userId1) {
        data.userId1Typing = dataReq.isTyping;
      } else {
        data.userId2Typing = dataReq.isTyping;
      }
      data.save()
          .then(() => {
            ChatOverview.findIdChat({ _id: data._id }).then((data) => {
              socket.emit('/api/chat/typing', data || []);
              socket.in(`/api/chat/${dataReq.chatId}`).emit('/api/chat/typing', data);
              return null;
            });
            return null;
          });
      return null;
    });

    return null;
  });

  socket.on('/api/chats', (dataReq) => {
    ChatOverview.findChat({ $or: [{ userId1: dataReq._id }, { userId2: dataReq._id }] }).then((data) => {
      if (!data) {
        // socket.disconnect();
      }
      socket.emit('/api/chats', data || []);
      return null;
    });
    return null;
  });

  socket.on('/api/chats/markasread', (dataReq) => {
    Chat.update({ userId2: socket.userId, chatId: dataReq.chatId }, { isRead: true }, { multi: true }).then((data) => {
      if (!data) {
        // socket.disconnect();
      }

      Chat.findChat({ chatId: dataReq.chatId, isActive: true }).then((newdata) => {
        socket.emit(`/api/chat/${dataReq.chatId}`, newdata);
        socket.in(`/api/chat/${dataReq.chatId}`).emit(`/api/chat/${dataReq.chatId}`, newdata);
        return null;
      });
      return null;
    });
    return null;
  });

  socket.on('/api/chat/delete', (dataReq) => {
    Chat.update({ _id: dataReq.messageId, $or: [{ userId1: dataReq.userId1 }, { userId2: dataReq.userId2 }], chatId: dataReq.chatId }, { message: 'This message has been deleted' }).then((data) => {
      if (!data) {
        // socket.disconnect();
      }

      Chat.findChat({ _id: dataReq.messageId, chatId: dataReq.chatId, isActive: true }).then((newdata) => {
        // socket.emit('/api/chat/delete', newdata);
        socket.emit(`/api/chat/${dataReq.chatId}`, newdata);
        socket.in(`/api/chat/${dataReq.chatId}`).emit(`/api/chat/${dataReq.chatId}`, newdata);
      });

      // console.log(socket);
      return null;
    });
    return null;
  });
}


module.exports = { register };
