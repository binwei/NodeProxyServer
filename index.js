// Place near the top of your file, just below your other requires
// Set a the default value for --host to 127.0.0.1
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'

// Build the destinationUrl using the --host value
// Get the --port value
// If none, default to the echo server port, or 80 if --host exists
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)

// Update our destinationUrl line from above to include the port
let destinationUrl = argv.url || scheme  + argv.host + ':' + port

let path = require('path')
let fs = require('fs')
let logPath = argv.logfile && path.join(__dirname, argv.log)
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

let http = require('http')
let request = require('request')

http.createServer((req, res) => {
    console.log(`\nRequest received at: ${req.url}`)

    for (let header in req.headers) {
      res.setHeader(header, req.headers[header])
    }

    req.pipe(res)
}).listen(8000)

http.createServer((req, res) => {
  // Log the req headers and content
  logStream.write('\nRequest headers: ' + JSON.stringify(req.headers))
  req.pipe(logStream, {end: false})

  let url = req.headers['x-destination-url'] || destinationUrl + req.url
  logStream.write(`\nProxying request to: ${url}\n`)

  // Proxy code here
  let options = {
      headers: req.headers,
      url: `${url}`
  }

  options.method = req.method

  // Log the proxy request headers and content in the **server callback**
  let downstreamResponse = req.pipe(request(options))
  logStream.write('Response headers: ' + JSON.stringify(downstreamResponse.headers) + '\n')
  downstreamResponse.pipe(logStream, {end: false})
  downstreamResponse.pipe(res)

}).listen(8001)
