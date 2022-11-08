import whatsapp_web from 'whatsapp-web.js';
import QRCode from 'qrcode'
import { CronJob } from 'cron'
import fetch from 'node-fetch';
import moment from 'moment';
import { XMLParser } from "fast-xml-parser";

const { Client, LocalAuth } = whatsapp_web;

async function checkTrafficNews(msg) {
    const response = await fetch('https://www.td.gov.hk/tc/special_news/trafficnews.xml');
    const parser = new XMLParser();
    const XMLdata = await response.text();
    const XMLobject = parser.parse(XMLdata);
    const data = XMLobject.list.message;
    console.log(data);
    const anDate = new Date(data.ANNOUNCEMENT_DATE);
    const dateText = moment(anDate).format("HH:mm")
    const message = `*${data.INCIDENT_STATUS_CN}* ${dateText}
*${data.INCIDENT_HEADING_CN}*(${data.INCIDENT_DETAIL_CN})
${data.DIRECTION_CN} ${data.LOCATION_CN}
${data.CONTENT_CN}`
    msg.reply(message);
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "client-one" }),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    QRCode.toString(qr, { type: 'terminal' }, function (err, url) {
        console.log(url)
    })
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
    if (msg.body == '!tn') {
        checkTrafficNews(msg);
    }
});

client.initialize();