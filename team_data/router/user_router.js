const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const userRouter = express.Router();
const userModel = require('../model/user_model');

userRouter.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
}));

userRouter.post('/user', async (req, res) => {
    const user = {
        id: req.body.id,
        pw: req.body.pw
    };
    try {
        await userModel.register(user);
        let data = { msg: user.id + "님 환영합니다. 회원가입이 완료되었습니다." }
        res.render('login', {data: data});
    } catch(err) {
        res.status(500).send(err);
    }
});

userRouter.post('/login', async (req, res) => {
    const user = {
        id: req.body.id,
        pw: req.body.pw
    };
    let data;
    try {
        let result = await userModel.register(user);
        if(len(result[0][0]) > 0) {
            req.session.user = {
                index: result[0][0].index,
                ...user
            }
            data = { msg: user.id + "님 반갑습니다." }
        } else {
            data = { msg: "로그인 정보가 일치하지 않습니다." }
        }
        res.render('main', {data: data});
    } catch(err) {
        res.status(500).send(err);
    }
});
module.exports = userRouter;