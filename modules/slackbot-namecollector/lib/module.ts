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

function breakDownText(params) {
    const action = textDeconstructionRegex.exec(params.text)[1];
    return Object.assign(params, { action });
}

function collectNameHandler(params) {
    params = breakDownText(params);

    switch (params.action) {
        case 'add':
            openCreationDialog(params);
            break;
        case 'list':
            listLabels(params);
        default:
            break;
    }
}

function createLabelHandler(params) {
    const fileName = params.submission.lbl_name.replace(/\s/g, '_').toLowerCase().concat('.json');
    const filePath = path.resolve('./', 'datastores', params.team.domain, fileName);
    try {
        fs.ensureFileSync(filePath, { mode: '666' });
        fs.writeJSONSync(filePath, {
            owner: params.user.name,
            name: params.submission.lbl_name.toLowerCase(),
            domain: params.submission.lbl_domain
        });
    } catch (e) {
        console.error(e);
    }


}

function openCreationDialog(params) {
    openDialog({
        "trigger_id": params.trigger_id,
        "dialog": {
            "callback_id": "name-collector",
            "title": "Submit your label name",
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
    const files = fs.readdirSync(path.resolve('./', 'datastores', params.team_domain));
    let message = {
        text: 'As requested, here are the currently listed labels:',
        attachments: []
    };

    let names = files.map(file => {
        const content = fs.readJSONSync(path.resolve('./', 'datastores', params.team_domain, file));

        message.attachments.push({
            title: content.name,
            // text: `Domains: www.${content.domain}.nl, www.${content.domain}.com, www.${content.domain}.io`
        })

    });

    if(message.attachments.length === 0) message.text = ('no labels currently available. Please use \'add\' to create a new label suggestion.');
    post(message, params);
}

exports.collectName = collectNameHandler;
exports.createLabel = createLabelHandler;