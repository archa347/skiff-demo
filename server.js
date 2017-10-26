const Skiff = require('skiff');
const uuid = require('uuid/v4');
const program = require('commander');
const fs = require('fs');
const repl = require('repl');
const net = require('net');

program.option('--port <port>','port for this node to listen on',parseInt)
    .option('--nodeid <uuid>', 'id to use for this node')
    .option('--peers <peer list>','peers to attempt to join',(val) => {
        return val.split(',');
    })
    .parse(process.argv);


const addressPort = program.port || 56565;
const nodeId = program.nodeid || uuid();

const address = `/ip4/127.0.0.1/tcp/${addressPort}`;

const options = {
    location : `data/${nodeId}`,
    peers : program.peers || []
};

if (!fs.existsSync(options.location)) {
    fs.mkdirSync(options.location);
}

const skiff = Skiff(address,options)

skiff.on('started',() => {
    console.log('node started')
})

skiff.on('warning',console.log);
skiff.on('disconnect',(peer) => {console.log(`disconnect from ${peer}`)})
skiff.on('connect',(peer) => {console.log(`connected to ${peer}`)})
skiff.on('new state',(state) => console.log(`state changed to ${state}`))
skiff.on('leader',() => {console.log('now the leader')})
skiff.on('joined',(peerAddress) => console.log(`peer joined the cluster: ${peerAddress}`))
skiff.on('left',(peerAddress) => console.log(`peer left the cluster ${peerAddress}`))

skiff.start(err => {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        console.log(`node ${nodeId} started successfully`);
    }
})

var replServer = net.createServer((socket) => {
    let r = repl.start({
        prompt: `skiff-node-${nodeId}> `,
        input: socket,
        output: socket,
        terminal: true
    })
    r.on('exit', () => socket.end())
    r.context.skiff = skiff;
}).listen(`./skiff-${nodeId}.sock`);

process.on('SIGINT', () => {
    console.log(`shutting down node ${nodeId}`);
    replServer.close();
    process.exit(0);
});

