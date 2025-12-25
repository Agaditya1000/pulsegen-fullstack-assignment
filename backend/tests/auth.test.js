const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');

// Use the running app if exported, or we need to import app.
// Since server.js starts listening immediately, we might need to separate app definition.
// For now, let's assume we can require server.js, but we need to ensure it doesn't crash on port conflict if running.
// Strategy: Modify server.js to export app, and only listen if not in test mode.

// Actually, simplest 'Basic Testing' without refactoring the whole server:
// Connect to the RUNNING server via URL, or refactor server.js slightly.
// Let's refactor server.js slightly to be testable.

// Wait, I can't easily refactor server.js in one go without risk.
// Let's write a test that hits the *running* local server using axios, 
// OR use supertest on the exported app.
// I'll try to require server.js. If it listens on import, it might fail if port is taken.
// Let's check server.js content again.

const baseURL = 'http://localhost:5000/api';

describe('Auth Endpoints', () => {
    let token = '';
    const testUser = {
        username: 'testuser_' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'password123'
    };

    it('should register a new user', async () => {
        const res = await request(baseURL).post('/auth/register').send(testUser);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('should login the user', async () => {
        const res = await request(baseURL).post('/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail to login with wrong password', async () => {
        const res = await request(baseURL).post('/auth/login').send({
            email: testUser.email,
            password: 'wrongpassword'
        });
        expect(res.statusCode).toEqual(400);
    });
});
