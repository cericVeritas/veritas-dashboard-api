import winston from "winston";
import properties from "../properties";
import path from "path";

/**
 * Adapter for logger
 */
class Logger {
    constructor() {
        const errorStackFormat = winston.format((err) => {
            if (err.level == "error") {
                return Object.assign({}, err, {
                    stack: err.stack,
                    message: err.message,
                });
            }
            return err;
        });

        let transports = [
            new winston.transports.Console({
                format: winston.format.combine(
                    errorStackFormat(),
                    winston.format.colorize(),
                    winston.format.json(),
                    winston.format.splat(),
                    winston.format.printf((info) => {
                        return `${info.level}: ${info.message}`;
                    })
                ),
                handleExceptions: true,
            }),
            ,
        ];

        // if (properties.DISABLE_AWS_LOG !== "true") {
        //     transports.push(
        //         new CloudWatchTransport({
        //             handleExceptions: true,
        //             logGroupName: properties.LOG_GROUP_NAME,
        //             logStreamName: "zipcan-api-" + properties.INSTANCE_ID,
        //             createLogGroup: true,
        //             createLogStream: true,
        //             submissionInterval: 2000,
        //             submissionRetryCount: 1,
        //             batchSize: 20,
        //             formatLog: (item) => {
        //                 return JSON.stringify({
        //                     time: item._date.toString(),
        //                     level: item.level,
        //                     message: item.message,
        //                     instance: properties.INSTANCE_ID,
        //                     type: item.meta.logType,
        //                     socketMsg: item.meta.socketMsg,
        //                     socketMsgTxt: item.meta.socketMsgTxt,
        //                     socketId: item.meta.socketId,
        //                 });
        //             },
        //         })
        //     );
        // }

        this.logger = winston.createLogger({
            level: properties.LOG_LEVEL || "debug",
            format: winston.format.json(),
            transports: transports,
        });
    }

    trace(...args) {
        this.logger.trace(...args);
    }
    debug(...args) {
        this.logger.debug(...args);
    }
    info(...args) {
        this.logger.info(...args);
    }
    warn(...args) {
        this.logger.warn(...args);
    }
    error(...args) {
        this.logger.error(...args);
    }
    express(msg) {
        this.logger.debug({ message: msg.substr(0, 150), logType: "Express" });
    }
    socket(msg, socketMsg, socketId) {
        var socketMsgTxt = "";
        try {
            socketMsgTxt = JSON.stringify(socketMsg);
        } catch (e) {}

        this.logger.debug({
            message: msg,
            socketMsgTxt: socketMsgTxt,
            socketMsg: socketMsg,
            socketId: socketId,
            logType: "Socket",
        });
    }
    call(msg) {
        this.logger.warn({ message: msg, logType: "End call" });
    }
}

export default new Logger();
