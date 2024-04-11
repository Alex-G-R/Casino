

function mysql_connect_database(conn, SQL_HOST, SQL_USER, SQL_DATABASE){
    conn.connect(function(err){
        if (err) throw err;
        console.log(`SQL connection succesfull: HOST: ${SQL_HOST}, USER: ${SQL_USER}, DATABASE: ${SQL_DATABASE}`);
    });
}

module.exports = {
    mysql_connect_database
}