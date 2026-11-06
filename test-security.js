const assert = require('node:assert/strict');
const { test } = require('node:test');
const { once } = require('node:events');
const express = require('express');
const bodyParser = require('body-parser');

test('untrusted search and registration fields are sent as text', async () => {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    require('./routes/main')(app, { shopName: 'Books' });
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
        const origin = `http://127.0.0.1:${server.address().port}`;
        const input = '<img src=x onerror=alert(1)>';
        const search = await fetch(`${origin}/search-result?keyword=${encodeURIComponent(input)}`);
        assert.match(search.headers.get('content-type'), /^text\/plain/);
        assert.match(await search.text(), /<img src=x onerror=alert\(1\)>/);
        const registration = await fetch(`${origin}/registered`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ first: input, last: 'Smith', email: 'a@example.com' }),
        });
        assert.match(registration.headers.get('content-type'), /^text\/plain/);
        assert.match(await registration.text(), /<img src=x onerror=alert\(1\)>/);
    } finally {
        server.close();
    }
});
