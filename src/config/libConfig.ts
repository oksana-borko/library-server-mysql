import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

export const PORT = 3500
dotenv.config()

export const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: +(process.env.DB_PORT || 3306),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10
    })

;(async () => {
    const c = await pool.getConnection()
    await c.ping()
    c.release()
    console.log('MySQL pool is ready')
})()
