const { MonitorType } = require( "./monitor-type");
const dayjs = require("dayjs");
const { UP,
    DOWN,
    sleep,
    log,
} = require( "../../src/util");
const {http} = require('http')
const {exec} = require("child_process")
const conf = require("../../config/shawdowsocks")
const { ss_path } = require("../../config/shawdowsocks");
const ProxyAgent = require('simple-proxy-agent');
const fetch = require('node-fetch');

// monitor shadowsocks endpoint
class ShadowsocksMonitorType extends MonitorType {
    name = 'shadowsocks'

    /**
     *
     */
    async check(monitor , heartbeat, _server) {
        let failed = false, finished = false
        log.info('shadowsocks',`monitor#${monitor.id} shadowsocks:` + monitor.url)
        // console.log('path:', conf.ss_path);
        const ssConf = ssUrlParse(monitor.url)
        const ssCmd = `${conf.ss_path} -c 'ss://${ssConf.link}' --verbose -socks :${monitor.port}`
        log.info('shadowsocks','ssCmd:' + ssCmd)
        const st = exec(ssCmd, (error, stdout, stderr) => {
            if (finished) {
                log.info('shadowsocks','shutdown ss proxy. Monitor #'+monitor.id)
            }
            if (!finished && error) {
                failed = true
                log.error('shadowsocks',`sslocal Monitor #${monitor.id} failed: ${error.message}`)
                // heartbeat.msg = error.message
                // heartbeat.status = DOWN
                return
            }

            if (!finished && stderr) {
                log.error('shadowsocks',`Monitor#${monitor.id} stderr: ${stderr}`)
                return
            }

            log.info('shadowsocks',`exec callback proxy monitor #${monitor.id} ${ssConf.remark} @ ${monitor.port} stdout: ${stdout}`)
        })
        log.info('shadowsocks','monitor.id'+monitor.id+' |pid:'+st.pid)
        log.info('shadowsocks','sleep before request monitor.id:' + monitor.id);
        await sleep(5000)
        setTimeout(() => {
            log.info('shadowsocks',`Monitor#${monitor.id} kill pid:`+st.pid)
            st.kill('SIGKILL')
        }, 4000)
        log.info('shadowsocks','begin request... monitor.id'+monitor.id)
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
        // st.kill('SIGKILL')
        log.info('shadowsocks',`shawdowsocks ${ssConf.remark} check finished`)
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
