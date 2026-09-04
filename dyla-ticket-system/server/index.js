const express = require('express');
const { createClient } = require('redis');
const fs = require('fs');
const app = express();
const port = 3000;

const redisClient = createClient();
redisClient.on('error', err => console.log('Redis Client Error', err));

const luaScript = fs.readFileSync('./ticket.lua', 'utf8');
let clients = [];
let soldOut = false;

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    if (soldOut) {
        res.write('data: {"status": "SOLD_OUT"}\n\n');
        return res.end();
    }
    
    clients.push(res);
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

app.post('/buy-ticket', async (req, res) => {
    if (soldOut) {
        return res.status(403).json({ error: 'Sold out' });
    }
    
    try {
        const result = await redisClient.executeIsolated(async (isolatedClient) => {
            return await isolatedClient.sendCommand(['EVAL', luaScript, '1', 'inventory']);
        });

        if (result === 1) {
            const remaining = await redisClient.get('inventory');
            if (parseInt(remaining) === 0 && !soldOut) {
                soldOut = true;
                clients.forEach(client => {
                    client.write('data: {"status": "SOLD_OUT"}\n\n');
                    client.end();
                });
                clients = [];
            }
            return res.status(200).json({ success: true, message: 'Ticket secured' });
        } else {
            return res.status(403).json({ error: 'Sold out' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

async function start() {
    await redisClient.connect();
    await redisClient.set('inventory', '100'); 
    soldOut = false;
    app.listen(port, () => console.log(`Server running on port ${port}`));
}
start();