const net = require("net")
const { btoa } = require("node:buffer");
const { parseURL } = require("whatwg-url");
const { Encryptor } = require("./encrypt");
const utils = require("./utils")
const METHODS = [
    "none",
    "table",
    "rc4",
    "rc4-md5",
    "rc4-md5-6",
    "salsa20",
    "chacha20",
    "chacha20-ietf",
    "aes-256-cfb",
    "aes-192-cfb",
    "aes-128-cfb",
    "aes-256-cfb1",
    "aes-192-cfb1",
    "aes-128-cfb1",
    "aes-256-cfb8",
    "aes-192-cfb8",
    "aes-128-cfb8",
    "aes-256-ctr",
    "aes-192-ctr",
    "aes-128-ctr",
    "aes-256-gcm",
    "aes-192-gcm",
    "aes-128-gcm",
    "bf-cfb",
    "camellia-128-cfb",
    "camellia-192-cfb",
    "camellia-256-cfb",
    "cast5-cfb",
    "des-cfb",
    "idea-cfb",
    "rc2-cfb",
    "seed-cfb",
    "chacha20-ietf-poly1305",
    "chacha20-poly1305",
    "xchacha20-ietf-poly1305",
    "sodium-aes-256-gcm"
];

const PROTOCOLS = [
    "origin",
    "verify_simple",
    "verify_sha1",
    "auth_simple",
    "auth_sha1",
    "auth_sha1_v2",
    "auth_sha1_v4",
    "auth_aes128_md5",
    "auth_aes128_sha1",
    "auth_chain_a",
    "auth_chain_b"
];

const OBFSES = [
    "plain",
    "http_simple",
    "http_post",
    "tls1.0_session_auth",
    "tls1.2_ticket_auth",
    "tls1.2_ticket_fastauth"
];

class SsConfig {
    server = ''
    port = 0
    password = ''
    timeout = '';
    method = '';
    remark = '';
    obfs = '';
    protocol = '';
}

// 参考 https://github.com/zhiyuan-l/SS-Config-Generator/blob/master/gen.js
function ssDecode(ssUrl) {
    // let remark = '';
    s = new(SsConfig)
    if ( ssUrl.indexOf('#') > -1 ) {
        const _part = ssUrl.split('#')
        ssUrl = _part[0]
        s.remark = _part[1]
    }

    console.log('s.remark', s.remark);

    // ss://YWVzLTI1Ni1nY206dzByZDIwMTlAanMtbHlnLjRjZG4ueHl6OjgwMDI#ssg-连云港
    const parts = ssUrl.split('://')
    const origin = atob(parts[1])
    const parsedUrl = parseURL(parts[0]+'://'+origin)
    console.log('parsedUrl:', parsedUrl)
    switch(parts[0]) {
        case 'ss':
            s.protocol = 'shadowsocks';
            s.method = parsedUrl.username
            s.server = parsedUrl.host
            break;
        case 'ssr':
            s.protocol = 'shadowsocks-r'
    }

    console.log('origin', origin);
    s.method

    // s.method =
    s.password = parsedUrl.password
    // s.server =
    s.port = parsedUrl.port
    s.timeout = 600
    return s
}

// https://github.com/arstgit/shadowsocks-lite/blob/master/lib/local.js#L16
let inBytesCnt = 0;
const addBytes = function(n) {
    inBytesCnt += n;
};
function connect(ssUrl) {
    const s = ssDecode(ssUrl)
    utils.error('test utils.error')
    const server = net.createServer(function (connection){
        console.info(`net.createServer: method: ${s.method} , password: ${s.password}`)
        let encryptor = new Encryptor(s.password, s.method)
        let stage = 0
        let headerLength = 0
        let remote = null
        let addrLen =0

        const clean = () => {
            remote = null
            connection = null
            encryptor = null
        }

        connection.on('data', function (data) {
            console.info('connect.data stage:', stage)
            if (4 === stage) {
                data = encryptor.encrypt(data)
                if ( !remote.write(data) ) {
                    connection.pause()
                }

                return
            }

            if (stage === 0) {
                connection.write("0500", "hex")
                stage = 1
                return
            }

            if (stage === 1) {
                connection.end("05070001", "hex")
                utils.error()
            } // end of stage 1
        }) // connection.on(data)

        connection.on("end", function() {
            if (remote) {
                return remote.end();
            }
        }); // connection.on('end')

        connection.on("error", function(e) {
            return utils.error(`local error: ${e}`);
        }); // connection.on("error",

        connection.on("close", function(had_error) {
            if (had_error) {
                if (remote) {
                    remote.destroy();
                }
            } else {
                if (remote) {
                    remote.end();
                }
            }
            return clean();
        }); // connection.on('close')
        connection.on("drain", function() {
            if (remote && stage === 4) {
                return remote.resume();
            }
        }); // connect.on('drain')

        return connection.setTimeout(s.timeout, function() {
            if (remote) {
                remote.destroy();
            }
            if (connection) {
                return connection.destroy();
            }
        });

    }) // createServer
    server.listen(19801, 'localhost', () => {
        console.info('server.listening')
    })

    utils.intervalInfo(() => {
        utils.info(`--> ${(inBytesCnt / (5 * 1024)).toFixed(2)} KB/s`);
        inBytesCnt = 0;
    });

    console.log('send of connect');
}


module.exports = {
    ssDecode,
    connect,
}
