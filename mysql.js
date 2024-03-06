const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'sql6.freesqldatabase.com',
    user: 'sql6688893',
    database: 'sql6688893',
    password: 'fJt8g8PAYd',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results);
        });
    });
};


module.exports = {
    query
};
