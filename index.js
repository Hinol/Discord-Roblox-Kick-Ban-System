const rbx_key = require('./secrets/roblox_key.json').rbx_key; // Roblox Messaging Service API key
const rbx_db = require('./secrets/roblox_key.json').rbx_db_key; // Roblox DataStore API key
const express = require('express');
const axios = require('axios');
const bodyparser = require('body-parser');
const app = express();
const api_key = require('./secrets/api_key.json').api_key; // Your API key for this API NOT FOR ROBLOX API
const universe_id = "6330068421" // Set universe id of your game
const db_name = "BansData" // Set the name of DataStore using in your game 

app.use(bodyparser.json());

// This function is for simple protection for your API if you wanna you can use jsonwebtoken or something  else

function CheckApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== api_key) {
        return res.status(401).send('Unauthorized');
    }
    next();
}

app.post('/messaging/kick/player', CheckApiKey, async (req, res) => {
    const Player = req.query.name;
    const Reason = req.body.reason;
    const Admin = req.body.admin;

    try {
        const Message = Player + "::" + Reason + "::" + Admin;

        let response = await axios.post(`https://apis.roblox.com/messaging-service/v1/universes/${universe_id}/topics/kick`, 
        JSON.stringify({ message: Message }), 
        {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": rbx_key
            }
        });
        
        if (response.status === 200) {
            console.log(response.data);
            res.status(200).send('Player kicked successfully');
        } else {
            console.log('Failed to kick player');
            res.status(500).send('Server error');
        }
    } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
            res.status(500).send(error.response.data);
        } else {
            res.status(500).send('Error processing request');
        }
    }
});

app.post('/messaging/tempban/player', CheckApiKey, async (req, res) => {
    const player = req.query.name;
    const { reason, admin, until } = req.body;

    if (!player || !reason || !admin || !until) {
        return res.status(400).send('Bad Request');
    }

    try {
        const response = await axios.post(
            `https://apis.roblox.com/datastores/v1/universes/${universe_id}/standard-datastores/datastore/entries/entry`,
            {
                value: JSON.stringify({ reason, admin, date: until })
            },
            {
                params: {
                    'entryKey': `Ban_${player}`,
                    'datastoreName': db_name
                },
                headers: {
                    'x-api-key': rbx_db,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 200) {
            res.status(200).send('Player temporarily banned');
        } else {
            console.error('Failed to ban player', response.data);
            res.status(500).send('Server error');
        }
    } catch (error) {
        console.error('Error banning player:', error.response ? error.response.data : error.message);
        res.status(500).send('Server error');
    }
});

app.get('/messaging/tempban/player', CheckApiKey, async (req, res) => {
    const Player = req.query.name;


    try {
        const response = await axios.get(`https://apis.roblox.com/datastores/v1/universes/${universe_id}/standard-datastores/datastore/entries/entry`, {
            params: {
               'entryKey': `Ban_${Player}`,
                'datastoreName': db_name
            },
            headers: {
                'x-api-key': rbx_db,
                'Content-Type': 'application/json'
            }
        });

        if (response.data) {
            res.status(200).json(response.data);
        } else {
            res.status(404).send('No ban found for player');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`server started`);
});
