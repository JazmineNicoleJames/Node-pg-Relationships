process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

//setup
let testInvoices;
let invoiceResult;


beforeEach(async () => {
    try{
        const compResult = await db.query(
            `INSERT INTO companies (code, name, description) 
            VALUES ('hello','hi', 'does this work') RETURNING code`);

        const code = compResult.rows[0].code;

        invoiceResult = await db.query(
                `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) 
                VALUES ($1, 100.00, false, $2, $3) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
                [code, '2022-03-02', null]
        );

        console.log('invoiceResult', invoiceResult.rows)
        testInvoices = invoiceResult.rows[0]

    } catch(e){
        console.error(e);
    }
});




describe('GET /', () => {
    test('Gets a list of 1 invoices', async () => {
        const response = await request(app).get('/invoices');
        
        expect(response.statusCode).toEqual(200);

        expect(response.body).toEqual( 
            {"invoices": 
                [{"add_date": "2022-03-02T08:00:00.000Z", 
                "amt": 100, 
                "comp_code": "hello", 
                "id": expect.any(Number), 
                "paid": false, 
                "paid_date": null}]}
        );
    });
});

describe('GET /invoices/:id', () => {
    test('Get a single invoice', async () => {
        const response = await request(app).get(`/invoices/${testInvoices.id}`);

        expect(response.statusCode).toBe(200);
    });
    test('respond with 404 if invoice does not exist', async () => {
        const res = await request(app).get(`/invoices/0`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({"error": {"message": "0 does not exist.", "status": 404}, "message": "0 does not exist."})
    })
})

 
describe('POST /invoices', () => {
    test('Test posting a new invoice', async () => {
        const response = await request(app).post(`/invoices`).send({comp_code: 'hello', amt:'200'})
        
        expect(response.statusCode).toBe(201);
    });
    test('Catch posting invalid data', async () => {
        const res = await request(app).post(`/invoices`).send({comp_code:'fakefake', amt:'1'})

        expect(res.statusCode).toBe(500);
    })
})


describe('PUT /invoices/:id', () => {
    test('Test updating a single invoice', async () => {
        const response = await request(app).put(`/invoices/${testInvoices.id}`)
        .send({amt: '1', paid:false});

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            invoice:{                 
                id: testInvoices.id,
                comp_code: testInvoices.comp_code,
                amt: 1,
                paid: testInvoices.paid,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });
    test('Catch updating a nonexisting invoice', async () => {
        const res = await request(app).put(`/invoices/0`).send({amt: '2'});

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({"error": {"message": "Can't find invoice 0", "status": 404}, "message": "Can't find invoice 0"})
    })
})


describe('DELETE /invoices/:id', () => {
    test('Deleting an invoice', async () => {
        console.log('testinvoiceshere', testInvoices.id)
        const res = await request(app).delete(`/invoices/${testInvoices.id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status:'deleted'});
    });
    test('Throw ExpressError if id does not exist', async () => {
        const res = await request(app).delete(`/invoices/0`);

        expect(res.statusCode).toBe(404)
    })
}) 


//tearDown
afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
    let stuff = await db.query(`SELECT * FROM companies`)
    console.log('proerply deleted!', stuff.rows)
    let stuffinvoice = await db.query(`SELECT * FROM invoices`)
    console.log('proerply deleted!', stuffinvoice.rows)
});

afterAll(async () => {
    await db.end();
});