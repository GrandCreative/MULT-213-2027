const notifier = require('node-notifier');
const path = require('path');

notifier.nofity({

    title: 'Hello!',
    message: 'This is a test message.',
    icon: path.join(__dirname, 'uwunimogchan.jpg'),
    sound: true,
    wait: true
});


console.log("I'm running code with Node.js! Cool!");
