const Imap = require('imap');
const mimelib = require('mimelib');
const log = require('signale').scope('MailWatcher');

module.exports = class MailWatcher {
    constructor(config) {
        log.info("Initialising");

        this.sessionInfo = {};
        this.config = config;

        this._imap = new Imap({
            user: config.username,
            password: config.password,
            host: config.host,
            port: config.port,
            tls: config.tls,
            secure: config.secure,
        });

        this._imap.on('ready', () => {
            log.info("Connected to IMAP server");

            this._imap.openBox(config.label, true, (err, box) => {
                if (err) {
                    log.error(err);
                }

                log.info("Mailbox opened");
            });
        });

        this._imap.on('error', (err) => {
            log.error(`IMAP error: ${err}`);

            log.info("Reconnecting in 5 seconds...")
            setTimeout(() => {
                this.connect();
            }, 5000);
        });

        this._imap.on('end', () => {
            log.info("IMAP connection ended, reconnecting in 5 seconds...");
            setTimeout(() => {
                this.connect();
            }, 5000);
        });

        this._imap.on('mail', () => {
            log.info('Searching for emails from Garmin')

            this._imap.search([
                ['FROM', 'noreply@garmin.com'],
                ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]   // Past 7 days
            ], (err, results) => {

                if (err) {
                    log.error(`Error on IMAP search: ${err}`);
                    return;
                }

                if (!results.length) {
                    log.error('No livetrack emails found');
                    return;
                }

                // fetch emails from search results
                let f = this._imap.fetch(results, {
                    struct: true,
                    markSeen: config.markSeen,
                    bodies: 'TEXT'
                });

                let messageSessions = []

                // for each matching message
                f.on('message', (msg, seqno) => {
                    log.info(`Found message ${seqno}`)

                    msg.on('body', (stream, info) => {
                        let body = '';

                        stream.on('data', (chunk) => {
                            body += chunk.toString('utf8');
                        });

                        stream.once('end', () => {

                            // decode email from Quoted-printable format
                            body = mimelib.decodeQuotedPrintable(body);

                            // search for session token and id
                            let regexResults = body.match('href="http[s]?://livetrack\.garmin\.com/session/([^/]*)/token/([^"]*)"');

                            if (!regexResults || regexResults.length !== 3) {
                                log.error(`No session url found in body: ${body}`);
                            } else {
                                messageSessions.push({Id: regexResults[1], Token: regexResults[2]});
                            }
                        });
                    });
                });

                // Just take the details from the latest message
                f.on('end', () => {
                    const sessionInfo = messageSessions.pop();
                    log.info(`Using latest message session - Id: ${sessionInfo.Id}, Token: ${sessionInfo.Token }`);
                    this.sessionInfo = sessionInfo;
                });
            });
        });

        this.connect();
    }

    connect() {
        log.info(`Connecting to ${this.config.host} with user ${this.config.username}`);
        this._imap.connect();
    }
}