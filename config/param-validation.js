const Joi = require('joi');

module.exports = {

  createAgent: {
    body: {
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
      countryCode: Joi.string().required(),
      country: Joi.string(),
      role: Joi.string().required(),
      password: Joi.string().min(6).max(15).required()
    }
  },
  updateAgent: {
    body: {
      firstName: Joi.string(),
      lastName: Joi.string(),
      email: Joi.string(),
      country: Joi.string(),
      state: Joi.string(),
      city: Joi.string(),
      street: Joi.string(),
      deviceToken: Joi.string(),
      fcmToken: Joi.string(),
      smsAlert: Joi.boolean(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  createUser: {
    body: {
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
      countryCode: Joi.string().required(),
      inviteCode: Joi.string(),
      country: Joi.string(),
      role: Joi.string().required(),
      password: Joi.string().min(6).max(15).required()
    }
  },
  updateUser: {
    body: {
      firstName: Joi.string(),
      lastName: Joi.string(),
      email: Joi.string(),
      country: Joi.string(),
      state: Joi.string(),
      city: Joi.string(),
      street: Joi.string(),
      deviceToken: Joi.string(),
      fcmToken: Joi.string(),
      isPrivate: Joi.boolean(),
      smsAlert: Joi.boolean(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  updateEmail: {
    body: {
      email: Joi.string().required(),
    },
  },
  deleteUser: {
    body: {
      password: Joi.string().min(6).max(15).required()
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  bvn: {
    body: {
      bvn: Joi.string().length(11).required()
    },
  },
  bvnVerify: {
    body: {
      bvn: Joi.string().length(11).required(),
      verificationCode: Joi.string().required()
    },
  },
  userReport: {
    body: {
      userId: Joi.string().required(),
    }
  },
  createPost: {
    body: {
      image: Joi.string(),
      color: Joi.string(),
      isMoment: Joi.boolean()
    }
  },
  createRePost: {
    body: {
      image: Joi.string(),
      sharedPost: Joi.object()
    }
  },
  createRePostComment: {
    body: {
      image: Joi.string(),
      sharedPost: Joi.object(),
      comment: Joi.string().required()
    }
  },
  createComment: {
    body: {
      postId: Joi.string().required(),
      comment: Joi.string().required(),
    }
  },

  // POST /api/auth/login
  login: {
    body: {
      identifier: Joi.string().required(),
      password: Joi.string().min(6).max(15).required(),
    }
  },
  // POST /api/users/forgot
  forgotPassword: {
    body: {
      phone: Joi.string().required(),
    }
  },

  // POST /api/user/changePassword
  changePassword: {
    body: {
      oldPassword: Joi.string().required(),
      password: Joi.string().required(),
    }
  },
  // POST /api/user/changePassword
  resetPassword: {
    body: {
      password: Joi.string().required(),
    }
  },
  // PATCH /api/users/forgot/verify
  forgotPasswordVerify: {
    body: {
      phone: Joi.string().required(),
      otp: Joi.string().required(),
    }
  },
  // PATCH /api/users/username
  username: {
    body: {
      username: Joi.string().required(),
    }
  },

  // POST /api/otp
  otp: {
    body: {
      phone: Joi.string().required(),
    }
  },
  otpEmail: {
    body: {
      email: Joi.string().required(),
    }
  },

  // POST /api/otp/verify
  otpVerify: {
    body: {
      phone: Joi.string().required(),
      otp: Joi.string().required(),
    }
  },

  otpVerifyEmail: {
    body: {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    }
  },

  // POST /api/bankAccount
  bankAccount: {
    body: {
      bankName: Joi.string().required(),
      account: Joi.string().required(),
      accountName: Joi.string().required(),
      password: Joi.string().min(6).max(15).required(),
      code: Joi.string().required()
    }
  },

  deleteApi: {
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },

  // POST /api/card
  card: {
    body: {
      name: Joi.string().required(),
      cardNumber: Joi.string().required(),
      expiryMonth: Joi.string().required(),
      expiryYear: Joi.string().required(),
      cvv: Joi.number().required(),
    }
  },

  // PATCH /api/users/contacts/find
  contactsFind: {
    body: {
      phones: Joi.array().required()
    }
  },

  // POST /api/userFollow
  userFollow: {
    body: {
      userId: Joi.string().required(),
    }
  },
  categorysBillers: {
    params: {
      categoryId: Joi.string().required()
    }
  },
  paymentItemsByBillerId: {
    params: {
      billerId: Joi.string().required()
    }
  },
  customerValidations: {
    body: {
      customerId: Joi.string().required(),
      paymentCode: Joi.string().required()
    }
  },
  sendBillPaymentAdvice: {
    body: {
      customerId: Joi.string().required(),
      paymentCode: Joi.string().required(),
      amount: Joi.string().required(),
    }
  },
  chat: {
    body: {
      message: Joi.string(),
      file: Joi.object(),
      userId2: Joi.string().required(),
    }
  },
  call: {
    body: {
      chatId: Joi.string(),
    }
  },
  otpPayStack: {
    body: {
      account: Joi.string().required(),
      birthday: Joi.string().required(),
      code: Joi.string().required(),
      otp: Joi.string().required(),
      reference: Joi.string().required()
    }
  },
  otpPayStackCard: {
    body: {
      otp: Joi.string().required(),
      reference: Joi.string().required()
    }
  },
  pinPayStack: {
    body: {
      pin: Joi.string().required(),
      reference: Joi.string().required()
    }
  },
  payment: {
    body: {
      amount: Joi.number().required(),
      recievedBy: Joi.string().required(),
      //phone: Joi.string().required(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  paymentNonwaya: {
    body: {
      amount: Joi.number().required(),
      phone: Joi.string().required(),
      name: Joi.string().required(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  paymentSend: {
    body: {
      amount: Joi.number().required(),
      recieverId: Joi.string().required(),
      phone: Joi.string().required(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  paymentSendNonwaya: {
    body: {
      amount: Joi.number().required(),
      name: Joi.string().required(),
      phone: Joi.string().required(),
    }
  },
  topUpWalletViaCard: {
    body: {
      amount: Joi.number().required(),
      cardId: Joi.string().required(),
      pin: Joi.string().required()
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  topUpWalletViaCBank: {
    body: {
      amount: Joi.number().required(),
      bankId: Joi.string().required(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  topUpWalletViaCBankOtp: {
    body: {
      reference: Joi.string().required(),
      otp: Joi.string().required(),
    },
  },
  retrievePayment: {
    body: {
      phone: Joi.string().required(),
      amount: Joi.number().required(),
      otp: Joi.string().required(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  retrievePaymentOTP: {
    body: {
      phone: Joi.string().required(),
      amount: Joi.number().required()
    },
  },
  withdraw: {
    body: {
      amount: Joi.number().required(),
      bankId: Joi.string().required(),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  feedback: {
    body: {
      name: Joi.string().required(),
      email: Joi.string().required(),
      phone: Joi.string().required(),
      feedback: Joi.string().required(),
    },
  },
  ussdCode: {
    body: {
      accountIndex: Joi.number().required(),
      password: Joi.string().required(),
      amount: Joi.string().required(),
    }
  },
  rubieAccount: {
    body: {
      accountnumber: Joi.string().required(),
      bankcode: Joi.string().required(),
    }
  },
  qrCodeLength: {
    body: {
      length: Joi.number(),
    }
  },
  scanQRCode: {
    body: {
      qrKey: Joi.string().required(),
      phone: Joi.string().required(),
    }
  },
  qrCodeKey: {
    body: {
      qrKey: Joi.string().required(),
      phone: Joi.string().required(),
      otp: Joi.number().required(),
      agentId: Joi.string(),
    }
  },
  rubieAccountWithdraw: {
    body: {
      accountnumber: Joi.string().required(),
      bankcode: Joi.string().required(),
      bankName: Joi.string().required(),
      amount: Joi.number().required().min(1000),
    },
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  x_auth: {
    headers: {
      x_auth: Joi.string().min(6).max(15).required(),
    }
  },
  createGroup: {
    body: {
      name: Joi.string().required(),
      description: Joi.string(),
      type: Joi.string().required(),
      isPublic: Joi.boolean().required(),
    }
  },
  joinGroup: {
    body: {
      groupId: Joi.string().required(),
    }
  },


  // TS: More to add
  // TODO: add the validation for other masters too
};
