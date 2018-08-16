const querystring = require('querystring');
const express = require('express');
const app = express();
const {collectName, createLabel, voteForLabel} = require('./../modules/slackbot-namecollector/lib/module.ts');


app.get('/:endpoint', (req, res) => {
    res.send(req.params);
});

app.post('/:endpoint', function (req, res) {
    req.on("data",function(chunk){
        switch (req.params.endpoint) {
            case 'namecollector':
                collectName(querystring.parse(chunk.toString()));
                req.params = null;
                break;
            case 'dialogResponse':
                let query = JSON.parse(querystring.parse(chunk.toString()).payload);
                switch (query.callback_id) {
                    case 'voting_system':
                        req.params = voteForLabel(query);
                        break;
                    default:
                        req.params = createLabel(query);
                }
                break;
            default:
                console.error(`Call made to non-existent endpoint: '${req.params.endpoint}'!`);
                req.params = null;
        }
    });
    req.on("end", function(){
        res.send(req.params);
    });
});

app.listen(8282);
