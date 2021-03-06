const cheerio = require('cheerio');
const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const request = require('request-promise');
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(
    express.urlencoded({
        extended: true
    })
)

app.set('views', './views');
app.set('view engine', 'ejs');
app.get('/',async function(req,res){
    let chapter;
    const client = await pool.connect();
    if(req.query.chapter){
        chapter = req.query.chapter;
        await client.query(`UPDATE main_table SET chapter = `+ chapter +`;`);
    } else {
        const result = await client.query('SELECT * FROM main_table;');
        chapter = result.rows[0].chapter;
    }

    request('https://metruyenchu.com/truyen/ta-chi-muon-an-tinh-lam-cau-dao-ben-trong-nguoi/chuong-'+chapter, (error, response, html) => {
    }).then((data) => {
        const $ = cheerio.load(data); // load HTML
        // const regExp = /(?<=[a-z0-9A-z])([.])(?=[a-z0-9A-z])/g;
        let text1 = $('.nh-read__title').text();
        let text3 = $('.nh-read__content').text().replaceAll('."','."' +'\n' +'\n').replaceAll('. . .', '. . .' + '\n');
        // console.log(text3.replaceAll(regExp,'.\n'))
        res.render('index', {
            title1: text1,
            content: text3,
            chapter: chapter,
        });
    })
    client.release();
});
app.get('/db', async (req, res) => {
    try {
        const client = pool.connect();
        const result = client.query('SELECT * FROM main_table;');
        console.log(result)
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})
app.use('/', router);
const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`Server started on Port ${port}`));



