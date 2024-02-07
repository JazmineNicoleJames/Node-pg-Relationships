const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError')
const slugify = require('slugify')
const db = require('../db');



router.get('/', async (req, res, next) => {
    // Return a list of companies

    try {
        const results = await db.query(`SELECT * FROM companies`);

        return res.json({companies: results.rows});
    }catch(err){
        next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    //Return object of company, 
    //Return 404 status code if company can not be found.

    try{
        const { code } = req.params;

        const results = await db.query(`SELECT code, name, description, invoices.id
                                    AS id, amt, paid, add_date, paid_date
                                    FROM companies JOIN invoices 
                                    ON companies.code = invoices.comp_code 
                                    WHERE code = $1`,    
                                    [code]);

        if(results.rows.length === 0){
            throw new ExpressError(`Can't find company ${code}`, 404)
        }

        const formatted = {
                code: results.rows[0].code,
                name: results.rows[0].name,
                description: results.rows[0].description,
                invoices: {
                    id: results.rows[0].id,
                    amt: results.rows[0].amt,
                    paid: results.rows[0].paid,
                    add_date: results.rows[0].add_date,
                    paid_date: results.rows[0].paid_date
                }
        };

        return res.json({company: [formatted]});
    }catch(err){
        
        /* console.error(err); */
        next(err);
    }
});


router.post('/', async (req, res, next) => {
    // Add a new company

    try {
        const { name, description } = req.body;
        const code = slugify(name);
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) 
                                    RETURNING code, name, description`, 
                                    [code, name, description]);
        console.log('tesults',results.rows)

        return res.status(201).json({company: results.rows[0]})                                
    }catch(err){
        console.error(err);
        return next(err)
    }
});


router.put('/:code', async (req, res, next) => {
    // Edit existing company

    try{
        const { code } = req.params;
        const { name, description } = req.body;

        const results = await db.query(`UPDATE companies SET name = $1, description = $2
                                     WHERE code = $3 RETURNING code, name, description`,    
                                    [name, description, code]);

        if(results.rows.length === 0){
            throw new ExpressError(`Can't find company ${code}`, 404)
        }

        return res.json({company: results.rows[0]});
    }catch(err){
        console.error(err);
        return next(err);
    }
});


router.delete('/:code', async (req, res, next) => {
    // Delete a company

    try{
        const { code } = req.params;
        const results = await db.query(`DELETE FROM companies 
                                    WHERE code = $1 RETURNING code`, 
                                    [code]);

        if(results.rows.length === 0){
            throw new ExpressError(`company ${code} does not exist.`, 404)
        }

        return res.json({msg:'deleted'});
    }catch(err){
        next(err);
    }
})

module.exports = router;