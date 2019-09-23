const db = require('./connect');

// 사용자에 관련된 함수
class User {
    //회원가입
    register(user) {
        console.log(user)
        return new Promise(async (resolve, reject) => {
           let sql = 'INSERT INTO USER SET ?';
           try {
               let result = await db.query(sql, user);
               resolve(result);
           } catch(err) {
               reject(err);
           }
        });
    }
    // 로그인           
    login(user) {
        return new Promise(async (resolve, reject) => {
            let sql = 'SELECT * FROM USER WHERE id = ? and pw = ?';
            try {
                let result = await db.query(sql, [user.id, user.pw]);
                resolve(result);
            } catch(err) {
                reject(err);
            }
        });
    }
}

module.exports = new User();