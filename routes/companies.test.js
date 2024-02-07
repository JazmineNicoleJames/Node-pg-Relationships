process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

//setup
let testCompanies;

beforeEach(async () => {
    try{
        const result = await db.query(
        `INSERT INTO companies (code, name, description) 
        VALUES ('lg','LG Corporation', 'Electronics and Appliances') RETURNING code, name, description`);

        const companyCode = result.rows[0].code;

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];
        const paid_date = new Date('2024-02-05')

        await db.query(
            `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) 
            VALUES ($1, 100.00, true, $2, $3) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [companyCode, formattedDate, paid_date]
        );
        
        
        testCompanies = {
            code: companyCode,
            name: result.rows[0].name,
            description: result.rows[0].description
        }

    } catch(e){
        console.error(e);
    }
});




describe('GET /companies', () => {
    test('Gets a list of 1 company', async () => {
        const response = await request(app).get('/companies');

        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ companies: [testCompanies]});
    });
});

describe('GET /companies/:code', () => {
    test('Get a single company', async () => {
        const response = await request(app).get(`/companies/${testCompanies.code}`);

        expect(response.statusCode).toEqual(200);
        /* expect(response.body).toEqual({company: [companyAndInvoice]}); */
    });

    test('Throw error if company code does not exist', async () => {
        const res = await request(app).get(`/companies/0`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({"error": {"message": "Can't find company 0", "status": 404}, "message": "Can't find company 0"})
    })
})


describe('POST /companies', () => {
    test('Test posting a new company', async () => {
        const response = await request(app).post(`/companies`).send({code: 'android', name:'Samsung', description:'operating system'})
        
        expect(response.statusCode).toBe(201);
    });

    test('Catch error', async () => {
        const res = await request(app).post(`/companies`).send({code: 'lg', name:'LG Corporation', description:'operating system'})

        expect(res.statusCode).toBe(500);
        expect(res.body.error.detail).toEqual('Key (name)=(LG Corporation) already exists.')
    })
})


describe('PUT /companies/:code', () => {
    test('Test updating a single company', async () => {
        const response = await request(app).put(`/companies/${testCompanies.code}`).send({code:'lg', name:'Lifes Good', description:'Electronics and Appliances'});

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company: {code:'lg', name: 'Lifes Good', description:'Electronics and Appliances'}})
    });
    test('Catch if company does not exist', async () => {
        const res = await request(app).put(`/companies/fakecompany`).send({code:'fake', name:'fake', description:'fake'});
        
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({"error": {"message": "Can't find company fakecompany", "status": 404}, "message": "Can't find company fakecompany"})
    })
})


describe('DELETE /companies/:code', () => {
    test('Deleting a company', async () => {
        const response = await request(app).delete(`/companies/${testCompanies.code}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({msg:'deleted'});
    });
    test('Throw ExpressError if code does not exist', async () => {
        const res = await request(app).delete(`/companies/0`);

        expect(res.statusCode).toBe(404)
    })
})


//tearDown
afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
    let stuff = await db.query(`SELECT * FROM companies`)
    console.log('properly deleted!', stuff.rows)
    let stuffinvoice = await db.query(`SELECT * FROM invoices`)
    console.log('properly deleted!', stuffinvoice.rows)
});

afterAll(async () => {
    await db.end();
});