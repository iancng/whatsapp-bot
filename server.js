import whatsapp_web from 'whatsapp-web.js';
import QRCode from 'qrcode';
//import { CronJob } from 'cron'
import fetch from 'node-fetch';
import moment from 'moment';
import { XMLParser } from "fast-xml-parser";
import util from 'util';


const { Client, LocalAuth, Util } = whatsapp_web;
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
    //log all message in console
    console.log(`${msg.from} sent message ${msg.body}`);
    if (msg.ack == 4){
        //nothing is done
    }
    if(msg.hasQuotedMsg){
        let quotedMsg = await msg.getQuotedMessage();
        if(quotedMsg.fromMe){

        }
        else{

        }
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
!demoteall - Demote all members to user (Require Admin Privilage)
!diu - diu nei
!reaction - Gives reaction to message
!sleep - Sleep for 5 seconds`
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
        msg.reply(`Chat ID: ${chat.id}\nChat Name:${chat.name}`)
    }
    else if(msg.body == "!showkickcmd"){
        msg.reply('Group會重用🙏🏻');
    }
    else if (msg.body == '!kickgroup' || msg.body == 'Group會重用🙏🏻'){
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
                if(!participant.isAdmin){
                    partIdList.push(partId);
                }
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
                if(participant.isAdmin){
                    partIdList.push(partId);
                }
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
        msg.react("🖕🏻")
        msg.reply('diu nei');
    }
    else if(msg.body == '!reaction'){
        let quotedMsg = await msg.getQuotedMessage();
        if(quotedMsg != undefined){
            quotedMsg.react("💯")
        }
        else{
            msg.react("💯")
        }
    }
    else if (msg.body == "!sleep"){
        let msgReply = await msg.reply("Sleep for 5 secounds");
        await wait(5);
        msgReply.reply("I am awake")
    }
    else if(msg.body == "!privateForward"){

    }
    else if(msg.body == "!getchat"){
        let allChats = await client.getChats();
        console.log(allChats);

    }
});

client.initialize();

//All functions are below

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

async function wait(seconds){
    return await new Promise(resolve => setTimeout(resolve, seconds*1000));
}
