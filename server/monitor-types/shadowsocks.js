const { MonitorType } = require( "./monitor-type");
const dayjs = require("dayjs");
const { UP,
    DOWN,
    sleep,
    log,
} = require( "../../src/util");
const {http} = require('http')
const {exec} = require("node:child_process")
const conf = require("../../config/shawdowsocks")
const { ss_path } = require("../../config/shawdowsocks");
const ProxyAgent = require('simple-proxy-agent');
const fetch = require('node-fetch');
const { spawn } = require("node:child_process");

// monitor shadowsocks endpoint
class ShadowsocksMonitorType extends MonitorType {
    name = 'shadowsocks'

    /**
     *
     */
    async check(monitor , heartbeat, _server) {
        let failed = false, finished = false
        let killed = false
        log.info('shadowsocks',`monitor#${monitor.id} shadowsocksStart2:` + monitor.url)
        // console.log('path:', conf.ss_path);
        const ssConf = ssUrlParse(monitor.url)
        const ssCmd = `${conf.ss_path} -c 'ss://${ssConf.link}' --verbose -socks :${monitor.port}`
        log.info('shadowsocks','ssCmd:' + ssCmd)
        // const st = spawn(ssCmd,{shell:false,timeout: 50 * 1000}, (error, stdout, stderr) => {
        //     log.info('shadowsocks','shutdown ss proxy. Monitor #'+monitor.id +':finished:'+finished)
        //
        //     if (!finished && error) {
        //         failed = true
        //         log.error('shadowsocks',`sslocalMonitor #${monitor.id} failed: ${error.message}`)
        //         // heartbeat.msg = error.message
        //         // heartbeat.status = DOWN
        //         return
        //     }
        //
        //     if (!finished && stderr) {
        //         log.error('shadowsocks',`Monitor#${monitor.id} stderr: ${stderr}`)
        //         return
        //     }
        //
        //     log.info('shadowsocks',`execCallback proxy monitor #${monitor.id} ${ssConf.remark} @ ${monitor.port} stdout: ${stdout}`)
        // })
        // /Users/tom/go/bin/go-shadowsocks2 -c 'ss://aes-256-gcm:w0rd2019@bwg.4cdn.xyz:8001' --verbose -socks :8001
        const st = spawn(conf.ss_path,["-c", `ss://${ssConf.link}` ,'-socks', `:${monitor.port}`])
        st.stdout.on('data', (data) => {
            console.log('cmd.stdout.data', data.toString());
        })
        st.stderr.on('data', (data) => {
            log.info('shadowsocks','cmd.stderr.data:'+ data.toString());
        })
        st.on('close', (code) => {
            log.info('shadowsocks', `st.close code:${code}`)
        })
        log.info('shadowsocks','monitor.id'+monitor.id+' |pid:'+st.pid)

        await sleep(5000)
        setTimeout(() => {
            log.info('shadowsocks', `Monitor#${monitor.id} killPid2:` + st.pid)
            process.kill(st.pid)

            // st.kill('SIGKILL')
        }, 4000)

        log.info('shadowsocks',`begin request... monitor.id# ${monitor.id} ssPid: ${st.pid}`)
        console.time('request'+monitor.id)

        try {
            let startTime = dayjs().valueOf();
            const response = await fetch('http://myip.ipip.net', {
                agent: new ProxyAgent(`socks://127.0.0.1:${monitor.port}`),
            })

            let data = await response.text()
            data = data.trim()
            console.timeEnd('request'+monitor.id)
            log.info('shadowsocks','res data:|'+data+'|')
            if (data === '') {
                console.log('response:', response)
            }
            if (!failed) {
                heartbeat.ping = dayjs().valueOf() - startTime;
                heartbeat.msg = data;
                heartbeat.status = UP;
                // heartbeat.ping =
            }
            finished = true
        } catch (e) {
            log.error('shadowsocks', `Monitor#${monitor.id} failed to request.`)
            log.error('shadowsocks', e.toString())
            heartbeat.msg = e.toString()
            heartbeat.status = DOWN
        }

        // if (!killed) {
        //     killed = true
        //     // log.info(`finalKill ${st.pid}`)
        //     // process.kill(st.pid,'SIGKILL')
        // }

        log.info('shadowsocks',`shawdowsocks#${monitor.id} ${ssConf.remark} checkFinished`)
    }
}

module.exports = {
    ShadowsocksMonitorType,
}

function shadowsockTest(ssUrl) {

    return
}

function ssUrlParse(ssUrl) {
    let remark = '';
    if (ssUrl.indexOf('#') > -1) {
        const _part = ssUrl.split('#')
        ssUrl = _part[0]
        remark = _part[1]
    }

    const parts = ssUrl.split('://')
    const str = atob(parts[1])
    console.info(`${remark} : ${str}`)

    return {
        remark: remark,
        link: str,
    }
}

function sslocal(ssUrl) {
    exec("")
}
//
