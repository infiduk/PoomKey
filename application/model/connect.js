const mysql = require('mysql2/promise');
const config = {
    host : '127.0.0.1',
    user : 'poomkeyadmin',
    password : '1q2w3e4r!2',
    database : 'poomkey_poomkey',
    dateStrings: 'date'
};

const pool = mysql.createPool(config);
module.exports = pool;