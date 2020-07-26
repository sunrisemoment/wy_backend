const logger = require('./winston');
const config = require('./config');
const User = require('../server/user/user.model');
const UserWallet = require('../server/userWallet/userWallet.model');
const UserFollow = require('../server/userFollow/userFollow.model');

User.findOne({ _id: config.admin.userId }).then((admin) => {
  if (!admin) {
    User.create({
      _id: config.admin.userId,
      userName: 'wayaofficial',
      firstName: 'Waya',
      lastName: 'Official',
      email: 'admin@wayapay.com',
      country: 'NGN',
      role: 'SUPER_ADMIN',
      password: '123456',
      pin: '110064',
      inviteCode: `WayaApp_${config.admin.userId}`,
      phone: '+2340000000000',
      isActive: true,
      isVerify: true,
    }).then((user) => {
      console.log(user);
      UserWallet.create({ userId: user._id, clearedBalance: 0, availableBalance: 0 });
      UserFollow.create({
        userId: user._id,
        followersCount: 0,
        followingCount: 0
      });

      logger.log({
        level: 'info',
        message: 'finished populating users'
      });
    });
  }
});
