var net = require('net')
const commander = require('commander');

commander.option('--socket <socket>').parse(process.argv);


var sock = net.connect(commander.socket);

process.stdin.pipe(sock)
sock.pipe(process.stdout)

sock.on('connect', function () {
  console.log('socket connected')
  process.stdin.resume();
  process.stdin.setRawMode(true)
})

sock.on('close', function done () {
  console.log('socket closed')
  process.stdin.setRawMode(false)
  process.stdin.pause()
  sock.removeListener('close', done)
})

process.stdin.on('end', function () {
  sock.destroy()
  console.log()
})

process.stdin.on('data', function (b) {
  if (b.length === 1 && b[0] === 4) {
    process.stdin.emit('end')
  }
})