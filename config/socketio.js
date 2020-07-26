/**
 * Socket.io configuration
 */

const auth = require('../server/auth/auth.service');
const User = require('../server/user/user.model');
// import config from './environment';

// When the user disconnects.. perform this
function onDisconnect(socket) {
  User.findOneAndUpdate({ _id: socket.userId }, { isOnline: false, lastSeen: Date.now() }).then(() => null);
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  // socket.on('chat', data => {
  //   socket.log(JSON.stringify(data, null, 2));
  // });

  User.findOneAndUpdate({ _id: socket.userId }, { isOnline: true }).then(() => null);
  // Insert sockets below
  require('../server/chat/chat.socket').register(socket);
}

function _sockets(socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));

  socketio.on('connection', (socket) => {
    // console.log('a client has connected');
    socket.log = function (...data) {
      console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
    };


    socket.address = `${socket.request.connection.remoteAddress}:${socket.request.connection.remotePort}`;

    // Check Auth & Disconnect when required
    auth.isAuthenticatedWS(socket).then((_auth) => {
      console.log('Socket Connected By User:', _auth);
      if (!_auth) {
        socket.disconnect();
        return;
      }

      socket.userId = _auth;
      socket.connectedAt = new Date();

      // Call onDisconnect.
      socket.on('disconnect', () => {
        onDisconnect(socket);
        socket.log('DISCONNECTED');
      });

      // Call onConnect.
      onConnect(socket);
      socket.log('SOCKET CONNECTED');
    });
  });
}
module.exports = {
  _sockets
};
