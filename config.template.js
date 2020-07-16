module.exports = {
    // Mail credentials
    username: 'your.email@gmail.com',
    password: 'your_password',

    // Folder to output text files to for OBS to read
    //outputFolder: './stats',

    // IMAP host to connect to to read the email from garmin, defaults to gmail
    // host: 'imap.gmail.com',
    // port: 993,
    // tls: true,
    // secure: true,
    
    // Folder to look for the email in, defaults to INBOX but if you're using gmail and it doesn't find it try uncommenting the All Mail folder
    //label: '[Gmail]/All Mail',
    
    // Should we mark the garmin email seen after getting the link from it?
    // markSeen: false,

    // How often should we check for updated data from the Garmin API? It seems to update every 10 seconds or so
    // refreshTimeInMilliseconds: 4000,
  };