const dns = require('node:dns');
const net = require('node:net');

dns.setServers(['8.8.8.8', '1.1.1.1']);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}
