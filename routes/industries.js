const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError')

const db = require('../db');

router.get('/', async (req, res, next) => {
    // Get a list of invoices
    try{
        const results = await db.query(`SELECT * FROM industries`);
        return res.json({industries: results.rows})
    }catch(err){
        console.err(404, err.status)
        next(err)
    }
});

router.post('/', async (req, res, next) => {
    try{
        const { code, industry } = req.body; 
        console.log('codeindustry', code, industry)
        const results = await db.query(`INSERT INTO industries 
                                (code, industry) VALUES ($1, $2) 
                                RETURNING code, industry`,
                                [code, industry]);
        console.log('results', results)

        return res.status(201).json({industry: results.rows[0]})
    } catch(err) {
        console.error(err);
        return next(err);
    };
});

router.patch('/:code', async (req, res, next) => {
    try{
        const { company } = req.body;
        const { code } = req.params;

        const results = await db.query(`UPDATE industries 
                                SET comp_code = $1      
                                WHERE code = $2 
                                RETURNING code, industry, comp_code`,   
                                [company, code]);

        if(results.rows.length === 0){
            throw new ExpressError(`${code} not found`, 404)
        }
        return res.json(results.rows[0]);
    } catch (err){
        console.error(err)
        next(err);
    }
})

module.exports = router;