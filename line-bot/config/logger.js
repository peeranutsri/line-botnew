const winston = require("winston");
const fs = require("fs");

const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: `${logDir}/bot.log` }),
    new winston.transports.Console(),
  ],
});

module.exports = logger;
