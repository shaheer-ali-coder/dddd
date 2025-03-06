// Import Telegram Bot API
const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token
const token = '7072871960:AAEl3yjLpLIOrxhX-QvlHnGM5tSI0ZKtgvk';
const bot = new TelegramBot(token, { polling: true });
let time = 40000
// List of selected usernames to monitor responses from (without @ symbol)
const selectedUsernames = [];

// To track pending responses and store user IDs
const pendingResponses = new Map();
const userIds = new Map(); // Store user IDs for sending private messages
// Command to set a custom time (in milliseconds)
bot.onText(/\/time (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const newTime = parseInt(match[1], 10);

  if (!isNaN(newTime) && newTime > 0) {
    time = newTime;
    bot.sendMessage(chatId, `The timeout has been set to ${time} milliseconds.`);
    console.log(`Timeout set to ${time} milliseconds.`);
  } else {
    bot.sendMessage(chatId, 'Please provide a valid time in milliseconds (positive integer).');
  }
});

// Command to add a new selected username with user ID
bot.onText(/\/add (\S+) (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const newUsername = match[1].trim();
  const userId = parseInt(match[2], 10);

  if (!selectedUsernames.includes(newUsername)) {
    selectedUsernames.push(newUsername);
    userIds.set(newUsername, userId);
    console.log(`Added @${newUsername} with ID ${userId} to selected usernames.`);
    bot.sendMessage(chatId, `@${newUsername} has been added to the selected users with ID ${userId}.`);
  } else {
    bot.sendMessage(chatId, `@${newUsername} is already in the selected users.`);
  }
});

// Command to delete a selected username and its user ID
bot.onText(/\/delete (\S+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const usernameToDelete = match[1].trim();

  const index = selectedUsernames.indexOf(usernameToDelete);
  if (index !== -1) {
    selectedUsernames.splice(index, 1);
    console.log(selectedUsernames,userIds)
    userIds.delete(usernameToDelete);
    console.log(selectedUsernames,userIds)

    console.log(`Removed @${usernameToDelete} from selected usernames.`);
    bot.sendMessage(chatId, `@${usernameToDelete} has been removed from the selected users.`);
  } else {
    bot.sendMessage(chatId, `@${usernameToDelete} is not found in the selected users.`);
  }
});

// Listen to all messages
// Listen to all messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const senderUsername = msg.from.username;
  const senderId = msg.from.id;
  const messageId = msg.message_id;
  const messageText = msg.text;

  // Ignore messages starting with /add or /delete commands
  if (messageText && (messageText.startsWith('/add') || messageText.startsWith('/delete'))) {
    return;
  }

  // Store user ID for selected usernames
  if (selectedUsernames.includes(senderUsername) && !userIds.has(senderUsername)) {
    userIds.set(senderUsername, senderId);
    console.log(`User ID for @${senderUsername} is ${senderId}`);
  }

  // Ignore messages from selected usernames
  if (selectedUsernames.includes(senderUsername)) {
    return;
  }

  // If a non-selected user sends a message, start a 40-second timer
  const uniqueKey = `${chatId}_${messageId}`;

  if (!pendingResponses.has(uniqueKey)) {
    console.log(`Message from @${senderUsername}. Waiting for a response from a selected user.`);

    // Get the group name (chat title)
    bot.getChat(chatId).then((chat) => {
      const groupName = chat.title || 'Unknown Group'; // Default to 'Unknown Group' if no title exists

      // Set a 40-second timer
      const timeout = setTimeout(() => {
        console.log("Ha ho karabo e tsoang ho ba khethiloeng."); // No answer from selected users (in Sesotho)
        selectedUsernames.forEach((username) => {
          const userId = userIds.get(username);
          if (userId) {
            bot.sendMessage(
              userId,
              `Please respond to the pending message in the group: ${groupName}.`
            );
          }
        });
        pendingResponses.delete(uniqueKey);
      }, time); // 40,000 ms = 40 seconds

      // Store timer and usernames
      pendingResponses.set(uniqueKey, { timeout, answered: false });
    }).catch((err) => {
      console.error('Error fetching group chat:', err);
    });
  }
});


// Listen for messages from selected usernames to cancel the timer
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const senderUsername = msg.from.username;

  if (selectedUsernames.includes(senderUsername)) {
    // Clear any pending timers if a selected user responds
    for (const [key, value] of pendingResponses.entries()) {
      if (key.startsWith(`${chatId}_`) && !value.answered) {
        clearTimeout(value.timeout);
        pendingResponses.delete(key);
        console.log(`Karabo e fihlile ho @${senderUsername}. Timer e hlakotsoe.`); // Response received from a selected user.
      }
    }
  }
});

console.log('Telegram bot is running...');
