const https = require('https');
const fs = require('fs-extra');
const path = require('path');

function postMessage(message, params) {
    let path = /https:\/\/hooks\.slack\.com(.*)$/.exec(params.response_url)[1];
    let post_options = {
        host: 'hooks.slack.com',
        port: '443',
        path,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        }
    };

    let post_req = https.request(post_options, function(res) {
        res.on('data', function (chunk) {
            // console.log('Response: ' + chunk);
        });
    });

    post_req.on('error', (e) => {
        console.error(e);
    });

    // post the data
    post_req.write(JSON.stringify(message), 'utf8');
    post_req.end();


}

function openDialog(message) {
    const config = fs.readJSONSync(path.resolve('./config.json'));
    let post_options = {
        host: 'slack.com',
        port: '443',
        path: '/api/dialog.open',
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': `Bearer ${config.bearer}`
        }
    };

    // Set up the request
    let post_req = https.request(post_options, function(res) {
        res.on('data', function (chunk) {
            // console.log('Response: ' + chunk);
        });
    });

    post_req.on('error', (e) => {
        console.error(e);
    });

    // post the data
    post_req.write(JSON.stringify(message), 'utf8');
    post_req.end();


}

exports.post = postMessage;
exports.openDialog = openDialog;