import { Client as PostgresClient, QueryResult } from "pg"; 
import * as dotenv from "dotenv";


/* ============================================ */
/* SETUP                                        */
/* ============================================ */

// Import the .env environment variables 
dotenv.config({path: `${__dirname}/.env`});


/* ============================================ */
/* CONNECT TO THE DATABASE                      */
/* ============================================ */

export const connectDB = async () => {

    /* ============== TRY TO CONNECT ============== */
    try {

        // Instantiate the client
        const client = new PostgresClient({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASS,
            port: Number(process.env.DB_PORT)
        });
 
        await client.connect();
        const res: QueryResult = await client.query('SELECT * FROM bot_info');
        console.log("Connected to the database successfully: ", res.rows[0]);
        await client.end();
    } 

    /* =============== CATCH ERRORS =============== */
    catch (error) {
        console.log(error);
    }
}
