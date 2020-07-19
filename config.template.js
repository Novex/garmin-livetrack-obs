module.exports = {
    // Mail credentials
    username: 'your.email@gmail.com',
    password: 'your_password',

    // IMAP host to connect to to read the email from garmin, defaults to gmail
    // host: 'imap.gmail.com',
    // port: 993,
    // tls: true,
    // secure: true,
    
    // Folder to look for the email in, defaults to INBOX but if you're using gmail and it doesn't find it try uncommenting the All Mail folder
    //label: '[Gmail]/All Mail',
    
    // Should we mark the garmin email seen after getting the link from it?
    // markSeen: false,

    
    // Folder to output text files to for OBS to read
    //outputFolder: './stats',

    // Extra files to output, or overrides for existing templates (see index.js for the defaults)
    // - The key represents the name of the file to be created, the value is an ES6 template string with access to the latest API data object
    // - Templates can be nested, but if there's no corresponding data they'll be skipped. Nested templates only have access to the nested data.
    // - See Readme.md for an example of the API data object fields
    // outputTemplates: {
    //   speedInNauticalMiles: "${Math.round(speed * 1.94384)} knots", // eg. speed 6.1 => 12 knots
    // },

    // How often should we check for updated data from the Garmin API? It seems to update every 10 seconds or so
    // refreshTimeInMilliseconds: 4000,
  };