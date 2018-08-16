const {post, openDialog} = require('./../../../lib/support/http-request.module.ts');
const path = require('path');
const fs = require('fs-extra');

const theRules = `Met betrekking tot de naam zijn de volgende regels opgesteld:
- Moet te relateren zijn aan wat we doen
- We moeten met trots kunnen zeggen dat we hier voor werken
- De .com .nl & .io domeinen moeten beschikbaar zijn, waarbij de .nl een must is
- Geen streepjes in de domeinnaam
- Engels (in lijn met overige labels)
- Kort en krachtig`;

const textDeconstructionRegex = /^(.*?)(\s(.*)){0,}$/;

function printRules(params) {
    post({text: theRules}, params)
}

function breakDownText(params) {
    const action = textDeconstructionRegex.exec(params.text)[1];
    return Object.assign(params, {action});
}

function collectNameHandler(params) {
    params = breakDownText(params);

    switch (params.action) {
        case 'add':
            openCreationDialog(params);
            break;
        case 'list':
            listLabels(params);
            break;
        case 'rules':
            printRules(params);
            break;
        default:
            break;
    }

}

function createLabelHandler(params) {
    if (params.submission) {
        const fileName = params.submission.lbl_name.replace(/\s/g, '_').toLowerCase().concat('.json');
        const filePath = path.resolve('./', 'datastores', params.team.domain, fileName);
        let response = {};
        try {
            if (!fs.existsSync(filePath)) {
                fs.ensureFileSync(filePath, {mode: '666'});
                fs.writeJSONSync(filePath, {
                    owner: params.user.name,
                    name: params.submission.lbl_name.toLowerCase(),
                    domain: params.submission.lbl_domain
                });
            } else {
                response = {
                    "ok": false,
                    "error": "validation_errors",
                    "response_metadata": {
                        "messages": [
                            'The name supplied already exists'
                        ]
                    }
                }

            }
        } catch (e) {
            console.error(e);
        }
        return response;
    }
}

function openCreationDialog(params) {
    openDialog({
        "trigger_id": params.trigger_id,
        "dialog": {
            "callback_id": "name-collector",
            "title": "Submit your label name",
            "text": theRules,
            "submit_label": "Submit",
            "notify_on_cancel": true,
            "elements": [
                {
                    "type": "text",
                    "label": "Label name",
                    "name": "lbl_name"
                    // },
                    // {
                    //     "type": "text",
                    //     "label": "Domain",
                    //     "name": "lbl_domain"
                }
            ]
        }
    })
}

function listLabels(params) {
    let message = {
        text: 'As requested, here are the currently listed labels:',
        attachments: []
    };
    try {
        const files = fs.readdirSync(path.resolve('./', 'datastores', params.team_domain));
        files.map(file => {
            const content = fs.readJSONSync(path.resolve('./', 'datastores', params.team_domain, file));
            const inCounterList = ['r.rijnberk'].indexOf(params.user_name) !== -1;
            const votes = (inCounterList && content.voted ? content.voted.length : '0');
            const allowedChannel = ['names-collector-bot', 'fe-label-talk'].indexOf(params.channel_name) !== -1;
            const label = `${inCounterList && votes ? votes + ' : ' : ''}${content.name}`;
            const hasVoted = content.voted && content.voted.indexOf(params.user_name) !== -1;

            message.attachments.push({
                title: !allowedChannel ? label : `Click to ${hasVoted ? 'remove ' : ''}vote`,
                callback_id: "voting_system",
                actions: allowedChannel ? [
                    {
                        name: content.name,
                        text: label,
                        style: hasVoted ? "danger" : undefined,
                        type: "button",
                        value: file
                    }
                ] : undefined
                // text: `Domains: www.${content.domain}.nl, www.${content.domain}.com, www.${content.domain}.io`
            })

        });
    } catch (error) {
        console.error(error);
    }

    if (message.attachments.length === 0) message.text = ('no labels currently available. Please use \'add\' to create a new label suggestion.');
    post(message, params);
}

function voteForLabelHandler(params) {
    const filePath = path.resolve('./', 'datastores', params.team.domain, params.actions[0].value);
    const content = fs.readJSONSync(filePath);

    const hasVoted = content.voted && content.voted.indexOf(params.user.name) !== -1;

    content.voted = (content.voted || []);
    if(!hasVoted) {
        content.voted.push(params.user.name);
        fs.writeJSONSync(filePath, content);
        return `Je hebt gestemd op ${params.actions[0].name}.`;
    } else {
        content.voted.splice(content.voted.indexOf(params.user.name, 1));
        fs.writeJSONSync(filePath, content);
        return `Je hebt je stem op ${params.actions[0].name} ingetrokken.`;
    }
}

exports.collectName = collectNameHandler;
exports.createLabel = createLabelHandler;
exports.voteForLabel = voteForLabelHandler;