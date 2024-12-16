export class Logger {
    static LEVELS = {
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        DEBUG: 'DEBUG'
    };

    static log(component, message, level = Logger.LEVELS.INFO) {
        if (process.env.NODE_ENV === 'production' && level === Logger.LEVELS.DEBUG) {
            return; // Skip debug logs in production
        }

        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] [${component}] ${message}`;
        
        switch(level) {
            case Logger.LEVELS.WARN:
                console.warn(formattedMessage);
                break;
            case Logger.LEVELS.ERROR:
                console.error(formattedMessage);
                break;
            case Logger.LEVELS.DEBUG:
                console.debug(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }

    static info(component, message) {
        this.log(component, message, Logger.LEVELS.INFO);
    }

    static warn(component, message) {
        this.log(component, message, Logger.LEVELS.WARN);
    }

    static error(component, message, error) {
        const errorMessage = error ? `${message}: ${error.message || error}` : message;
        this.log(component, errorMessage, Logger.LEVELS.ERROR);
    }

    static debug(component, message) {
        this.log(component, message, Logger.LEVELS.DEBUG);
    }
}
