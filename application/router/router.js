const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const keyRouter = require('./key');
router.use(userRouter);
router.use(keyRouter);

const moment = require('moment'); require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

module.exports = router;        