const express = require('express')
const app = express();

var rate = require('.')

app.get('/', rate, function (req, res) {
    res.status(200).json({ name: 'tobi' });
});

app.listen(3000)