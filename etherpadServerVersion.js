var request = require('request');
var async = require('async');
var servers = ["http://beta.etherpad.org", "http://v.etherpad.org", "http://codepad-demo.d250.hu", "https://pad.riseup.net", "https://factor.cc/pad", "https://pad.okfn.org", "https://piratepad.ca", "http://pad.fnordig.de", "https://tihlde.org/etherpad/", "https://etherpad.wikimedia.org"];
var re = /Etherpad (.*) \(http:\/\/etherpad.org\)/; 
var masterPackageFileUrl = "https://raw.githubusercontent.com/ether/etherpad-lite/master/src/package.json";
var outServers = {};

request(masterPackageFileUrl, function(e, r, b){
  var mv = JSON.parse(b).version;
  console.log("Master Version", mv);

  async.eachSeries(servers, function(server, callback){
  
    request({
        url: server, 
        timeout: 2000
      }, function (error, response, body) {
      if (error){
        console.log("Unable to connect", server);
        callback();
      }
      if (!error && response.statusCode == 200) {
        var str = response.headers.server;
        // console.log(response.headers.server) // Show the HTML for the Google homepage.

        m = re.exec(str);
        if(m){
          var commit = m[1];
        }else{
          outServers[server] = {};
          outServers[server].version = "Unknown";
          outServers[server].status = "error";
          console.log("Unable to get commit", server);
          callback();
          return;
        }
        // console.log(server, commit);

        var packageFileUrl = "https://raw.githubusercontent.com/ether/etherpad-lite/"+commit+"/src/package.json";
        // console.log(packageFileUrl);

        request(packageFileUrl, function (error, res, pkg) {
          var v = JSON.parse(pkg).version;
          outServers[server] = {};
          outServers[server].version = v;

          if(mv > v){
            outServers[server].status = "warning";
            console.log("Master version is gt than Version -- Site potentially vulnerable", server);
          }else{
            outServers[server].status = "okay";
            console.log("Site is up to date", v, server);
          }
          callback();
        });
      }
    })
  });

});

