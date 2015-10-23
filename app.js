/*

Authored by: Doug Smith <info@laboratoryb.org>
---------------------------------------
A tool to automatically build dynamically load balance asterisk hosts with coreos & etc.
Part of a High Availability setup with Asterisk under coreOS & docker.
Works in both "dispatcher" mode, which sits next to a Kamailio box and watches for Asterisk to announce itself.
And in "announce" mode where it announces to Kamailio that it's available (and pulses heartbeats to it)

You can always get help with:

    node app.js --help

Run an dispatcher like:

    node app.js --etcdhost 192.168.1.1 --timeout 25000

Run an announcer like:

    node app.js --announce --etcdhost 192.168.1.1 --timeout 5500

*/

var Options = require('./Options.js');
var options = new Options();
var opts = options.options;

// Create a log object.
var Log = require('./Log.js');
var log = new Log(opts);

var Alive = require('./Alive.js');
var alive = new Alive(log,opts);

// Check to see if etcd is alive...
alive.isalive(function(err){

	if (!err) {

		// Ok, let's load this next module based on announce/dispatch mode.

		if (opts.announce) {

			// We need to generate a name if there isn't one. We'll use a UUID.
			if (!opts.announcename) {
				var uuid = require('uuid');
				opts.announcename = uuid.v4();
				log.warn("autogenerated_announce_name",{ announcing_as: opts.announcename });
			}

			// Instantiate our main app.
			var Announcer = require('./Announcer.js');
			var announcer = new Announcer(log,opts);

		} else {

			// Create the Kamailio object (which writes dispatcher.list files)
			var Kamailio = require('./Kamailio.js');
			var kamailio = new Kamailio(log,opts);

			// Instantiate our main app.
			var Dispatcher = require('./Dispatcher.js');
			var dispatcher = new Dispatcher(log,opts,kamailio);	

		}

	} else {

		// Ok, that's not good, we can't start if we can't see etcd.
		throw err;

	}

});