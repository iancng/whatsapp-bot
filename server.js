import whatsapp_web from 'whatsapp-web.js';
import QRCode from 'qrcode'
import { CronJob } from 'cron'
import fetch from 'node-fetch';
import moment from 'moment';
import { XMLParser } from "fast-xml-parser";

const { Client, LocalAuth } = whatsapp_web;
let myID = '85295860339@c.us';

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    authStrategy: new LocalAuth()
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

client.on('message', async msg => {
    if (msg.body == '!help'){
        msg.reply('Enter the following command:\n!tn - Traffic News\n!ping - Pong\n');
    }
    else if (msg.body == '!ping') {
        msg.reply('pong');
    }
    else if (msg.body == '!tn') {
        checkTrafficNews(msg, client);
    }
    else if (msg.body == '!info'){
        let chat = await msg.getChat();
        console.log(chat.id);
        msg.reply(`Chat ID: ${chat.id}\nChat Name:${chat.name}`)
    }
    else if (msg.body == '!kickgroup'){
        let chat = await msg.getChat();
        let groupChat = await client.getChatById(chat.id._serialized);
        let clientId = client.info.wid._serialized;
        if(chat.isGroup){
            let participants = groupChat.participants;
            let listOfRemove = [];
            participants.forEach(participant => {
                let partId = participant.id._serialized;
                if(partId != clientId && partId != myID){
                    listOfRemove.push(partId);
                }
            });
            groupChat.removeParticipants(listOfRemove);
            if(listOfRemove.length!=0){
                msg.reply("Removed " + listOfRemove)
            }
        }
        else{
            msg.reply('You must be in group to do so.')
        }
    }
    else if (msg.body == '!promoteall'){
        let chat = await msg.getChat();
        let groupChat = await client.getChatById(chat.id._serialized);
        let clientId = client.info.wid._serialized;
        if(chat.isGroup){
            let participants = groupChat.participants;
            let partIdList = [];
            participants.forEach(participant=>{
                let partId = participant.id._serialized;
                partIdList.push(partId);
            })
            groupChat.promoteParticipants(partIdList);
            if(partIdList.length!=0){
                msg.reply("All promoted to admin");
            }
        }
        else{
            msg.reply("You must be in group to do so.")
        }
    }
    else if (msg.body == '!demoteall'){
        let chat = await msg.getChat();
        let groupChat = await client.getChatById(chat.id._serialized);
        let clientId = client.info.wid._serialized;
        if(chat.isGroup){
            let participants = groupChat.participants;
            let partIdList = [];
            participants.forEach(participant=>{
                let partId = participant.id._serialized;
                partIdList.push(partId);
            })
            groupChat.demoteParticipants(partIdList);
            if(partIdList.length!=0){
                msg.reply("All demoted back to user");
            }
        }
        else{
            msg.reply("You must be in group to do so.")
        }
    }
    else if(msg.body == '!diu'){
        msg.reply('diu nei');
    }
});

client.initialize();


//All functions are below

async function checkTrafficNews(msg, client) {
    const info = client.info;
    const messageSentTime = moment().format("YYYY-MM-DD HH:mm");
    console.log(`${messageSentTime} ${msg.from} sent !tn`);
    const response = await fetch('https://www.td.gov.hk/tc/special_news/trafficnews.xml');
    const parser = new XMLParser();
    const XMLdata = await response.text();
    const XMLobject = parser.parse(XMLdata);
    const data = XMLobject.list.message;
    const anDate = new Date(data.ANNOUNCEMENT_DATE);
    const dateText = moment(anDate).format("HH:mm")
    const message = `*${data.INCIDENT_STATUS_CN}* ${dateText}
*${data.INCIDENT_HEADING_CN}*(${data.INCIDENT_DETAIL_CN})
${data.DIRECTION_CN} ${data.LOCATION_CN}
${data.CONTENT_CN}`
    msg.reply(message);
}
