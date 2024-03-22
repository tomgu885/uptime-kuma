// const {METHODS , OBFSES,ssDecode } = require('./methods')
const {
    parseProtocol
} = require("./url2config")
const { ssDecode,connect } = require("./methods");



// const { url2config } = require("./index");



// console.log('methods:', METHODS);
if(require.main == module) {
    // test code here
    console.log('this one');
    ssUrl = 'ss://YWVzLTI1Ni1nY206dzByZDIwMTlAanMtbHlnLjRjZG4ueHl6OjgwMDI#ssg-连云港'
    // const conf = ssDecode(ssUrl)
    // url.parse
    // console.log('conf', conf)
    // curl -x "socks5://localhost:19801" https://httpbin.org/ip
    connect(ssUrl)
}




module.exports = {

}
