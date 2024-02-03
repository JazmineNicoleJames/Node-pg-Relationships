const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError')

const db = require('../db');

router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT * FROM invoices`);

        return res.json({invoices: results.rows})
    }catch(err){
        console.error(err);
        next(err)
    }
});


router.get('/:id', async (req, res, next) => {
    try{
        const { id } = req.params;
        const results = await db.query(`SELECT invoices.id,
                        amt, paid, add_date, paid_date, companies.code 
                        AS company, name, description FROM invoices 
                        JOIN companies 
                        ON invoices.comp_code = companies.code
                        WHERE id = $1`, [id]);

        const formatted = {
            id: results.rows[0].id,
            amt: results.rows[0].amt,
            paid: results.rows[0].paid,
            add_date: results.rows[0].add_date,
            paid_date: results.rows[0].paid_date,
            company: {
                code: results.rows[0].company,
                name: results.rows[0].name,
                description: results.rows[0].description
            }
        }

        return res.json({invoice: [formatted]})
    } catch(err){
        console.error(err);
        next(err)
    }
});

router.post('/', async (req, res, next) => {
    try{
        const { comp_code, amt } = req.body;
        const results = await db.query(`INSERT INTO invoices 
                        (comp_code, amt) VALUES ($1, $2)    
                        RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
                        [comp_code, amt]);
        console.log('results', results)
        return res.status(201).json({invoice: results.rows[0]})
    }catch(err){
        console.error(err);
        next(err)
    }
});


router.put('/:id', async (req, res, next) => {
    try{
        const { id } = req.params;
        const { amt } = req.body;

        const results = await db.query(`UPDATE invoices 
                        SET amt = $1
                        WHERE id = $2 RETURNING id, comp_code, 
                        amt, paid, add_date, paid_date`,    
                                [amt, id]);

        if(results.rows.length === 0){
            throw new ExpressError(`Can't find invoice ${id}`, 404)
        }

        return res.json({invoice: results.rows});
    }catch(err){
        console.error(err);
        return next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try{
        const { id } = req.params;
        const results = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING id`, [id])
        if(results.rows.length === 0){
            throw new ExpressError(`Invoice ${id} does not exist.`, 404)
        }
        return res.json({status: "deleted"})
    }catch(err){
        console.error(err);
        next(err)
    }
})



module.exports = router; 