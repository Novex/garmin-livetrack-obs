const log = require('signale').scope('Core');
const MailWatcher = require('./lib/MailWatcher');
const fetch = require('node-fetch');
const TextOutputter = require('./lib/TextOutputter');
const assign = require('assign-deep');

const VERSION = require('./package.json').version

let config = {
    username: '',
    password: '',

    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    secure: true,
    label: 'INBOX',

    markSeen: false,

    outputFolder: './stats',
    outputTemplates: {
        gps: "${position.lat},${position.lon}",
        dateTime: "${new Intl.DateTimeFormat().format(new Date(dateTime))}",
        altitudeInFeet: "${Math.round(altitude)}",
        altitudeInMetres: "${Math.round(altitude * 0.3048)}",
        speedInMph: "${Math.round(speed * 2.2369362920544025)}",
        speedInKph: "${Math.round(speed * 3.6)}",
        fitnessPointData: {
            distanceInMiles: "${Math.round(distanceMeters / 1609.34 * 10) / 10}",
            distanceInKilometers: "${Math.round(distanceMeters / 1000 * 10) / 10}",
            durationInHhmm: "${new Date(durationSecs * 1000).toISOString().substr(11, 5)}",
            durationInHhmmss: "${new Date(durationSecs * 1000).toISOString().substr(11, 8)}"
        }
    },

    refreshTimeInMilliseconds: 4000
};

log.info(`Starting garmin-livetrack-obs v${VERSION}`);

try {
    assign(config, require('./config.js'));
} catch (e) {
    log.warn("You should create an obs.config.js file based on the obs.config.js.sample template to overwrite the default values")
}

const mailWatcher = new MailWatcher(config)

setInterval(async () => {
    if (!mailWatcher.sessionInfo.Id || !mailWatcher.sessionInfo.Token) {
        log.warn("No Garmin Livetrack Session Id/Token available yet, will try again in 4 seconds");
        return;
    }

    const url = `https://livetrack.garmin.com/services/session/${mailWatcher.sessionInfo.Id}/trackpoints?requestTime=${Date.now()}`

    log.info(`Fetching ${url}`);
    const response = await fetch(url);

    if (response.status !== 200) {
        log.warn("Invalid response received - The previous link may have expired and the new one hasn't been delivered yet?");
        
        const data = await response.text();
        log.warn(`response: ${data}`);
        
        return;
    }

    const data = await response.json();
    // const data = require('./trackpoints.json');
    
    const latestData = data.trackPoints.pop();

    // Output full trackpoints.json for advanced users
    TextOutputter.OutputFile(config.outputFolder, "trackpoints.json", data);

    // Output individual fields from the given templates
    TextOutputter.OutputToTextFiles(config.outputFolder, config.outputTemplates, latestData);

}, config.refreshTimeInMilliseconds);