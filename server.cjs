const { Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
		args: ['--no-sandbox'],
	}
});

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();
 