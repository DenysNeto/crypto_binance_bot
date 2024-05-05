import TelegramBot from "node-telegram-bot-api";

let bot = new TelegramBot("6919538601:AAH9FMpcH0ExW8jvIQIDti5TJP0MrfZu-GY", {
  polling: true,
});

function sendMessageToTelegram(message) {
  bot
    .sendMessage(392576703, message)
    .then(() => console.log("Message sent to Telegram successfully"))
    .catch((error) =>
      console.error("Error sending message to Telegram:", error)
    );
}

export default sendMessageToTelegram;
