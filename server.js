import whatsapp_web from 'whatsapp-web.js';
import QRCode from 'qrcode';
//import { CronJob } from 'cron'
import fetch from 'node-fetch';
import moment from 'moment';
import { XMLParser } from "fast-xml-parser";
import schedule from 'node-schedule';
import util from 'util';


const { Client, LocalAuth, Util } = whatsapp_web;
let myID = '85295860339@c.us';
let sharedGroup = '120363038944000073@g.us'

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

client.on('ready', async () => {
    //CLIENT READY
    console.log('Client is ready!');
    const job = schedule.scheduleJob('1 16  * * *', function(){
        groupDailyRefresh();
    });
});
client.on('message', async msg => {
    //log all message in console
    console.log(`${msg.from} sent message ${msg.body}`);
    if (msg.ack == 4 || (moment(new Date()).unix()-msg.timestamp > 10)){
        //nothing is done
    }
    else if (msg.body == '!help'){
        msg.reply(
            `Enter the following command:
!tn - Traffic News
!ping - Pong
!info - Show Chat Info
!kickgroup - Kick all members (Require Admin Privilage)
Group會重用🙏🏻 - Kick all members (Require Admin Privilage)
!showkickcmd - Show (Group會重用🙏🏻);
!promoteall - Promote all members to admin (Require Admin Privilage)
!groupkick - Kick all members of the shared group
!echo - Echo
!duty - Add duty name of shared group`
            );
    }
    else if (msg.body == '!ping') {
        msg.reply('pong');
    }
    else if (msg.body == '!tn') {
        msg.reply(await checkTrafficNews());
    }
    else if (msg.body == '!info'){
        let chat = await msg.getChat();
        msg.reply(`Chat ID: ${chat.id._serialized}\nChat Name:${chat.name}`)
    }
    else if(msg.body == "!showkickcmd"){
        msg.reply('Group會重用🙏🏻');
    }
    else if (msg.body == '!kickgroup' || msg.body == 'Group會重用🙏🏻'){
        kickGroup(await msg.getChat());
    }
    else if (msg.body == '!promoteall'){
        promoteGroup(await msg.getChat());
    }
    else if (msg.body == '!demoteall'){
        demoteGroup(await msg.getChat());
    }
    else if(msg.body == '!groupkick'){
        groupDailyRefresh();
    }
    else if (msg.body.startsWith('!echo ')) {
        // Replies with the same message
        msg.reply(msg.body.slice(6));
    }
    else if (msg.body.startsWith('!duty ')) {
        let chat = await client.getChatById(sharedGroup);
        const time = moment(new Date()).format("YYYY-MM-DD");
        let subject = time + msg.body.slice(5);
        chat.setSubject(subject);
    }
});

client.initialize();

//All functions are below

async function groupDailyRefresh(){
    let chat = await client.getChatById(sharedGroup);
    const time = moment(new Date()).format("YYYY-MM-DD");
    chat.setSubject(time)
    kickGroup(chat);
}

async function checkTrafficNews() {
    const messageSentTime = moment().format("YYYY-MM-DD HH:mm");
    const response = await fetch('https://www.td.gov.hk/tc/special_news/trafficnews.xml');
    const parser = new XMLParser();
    const XMLdata = await response.text();
    const XMLobject = parser.parse(XMLdata);
    const data = XMLobject.list.message;
    const anDate = new Date(data.ANNOUNCEMENT_DATE);
    const dateText = moment(anDate).format("HH:mm")
    const message = `*${data.INCIDENT_STATUS_CN}* ${dateText}
*${data.INCIDENT_HEADING_CN}* (${data.INCIDENT_DETAIL_CN})
${data.DIRECTION_CN} ${data.LOCATION_CN}
${data.CONTENT_CN}`
    return message;
}

async function checkWeather(){
    const response = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=flw&lang=tc');
    const data = await response.json();
    let message = `${data.forecastPeriod}
${data.forecastDesc}`;
    return message;
}

async function kickGroup(chat){
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
            groupChat.sendMessage("Removed " + listOfRemove)
        }
    }
    else{
        groupChat.sendMessage('You must be in group to do so.')
    }
}

async function promoteGroup(chat){
    let groupChat = await client.getChatById(chat.id._serialized);
    let clientId = client.info.wid._serialized;
    if(chat.isGroup){
        let participants = groupChat.participants;
        let partIdList = [];
        participants.forEach(participant=>{
            let partId = participant.id._serialized;
            if(!participant.isAdmin){
                partIdList.push(partId);
            }
        })
        groupChat.promoteParticipants(partIdList);
        if(partIdList.length!=0){
            groupChat.sendMessage("All promoted to admin");
        }
    }
    else{
        groupChat.sendMessage("You must be in group to do so.")
    }
}

async function demoteGroup(chat){
    let groupChat = await client.getChatById(chat.id._serialized);
    let clientId = client.info.wid._serialized;
    if(chat.isGroup){
        let participants = groupChat.participants;
        let partIdList = [];
        participants.forEach(participant=>{
            let partId = participant.id._serialized;
            if(participant.isAdmin){
                partIdList.push(partId);
            }
        })
        groupChat.demoteParticipants(partIdList);
        if(partIdList.length!=0){
            groupChat.sendMessage("All demoted back to user");
        }
    }
    else{
        groupChat.sendMessage("You must be in group to do so.")
    }
}

async function wait(seconds){
    return await new Promise(resolve => setTimeout(resolve, seconds*1000));
}
