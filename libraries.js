var fs = require('fs');
var spawn = require('child_process').spawn;
var http = require('http');
var unzip = require('unzip');

var REPOS = '/Users/josh/projects/junkrepos';

console.log("inside of the libraries");

function isInstalled() {
    console.log('checking if',this.id,'is installed');
    if(this.source == 'ide') return true;
    if(fs.existsSync(REPOS+'/'+this.id)) return true;
    return false;
}

function getIncludePath() {
    return REPOS+'/'+this.id;
}
function install(cb) {
    if(!fs.existsSync(REPOS)) {
        fs.mkdirSync(REPOS);
    }
    console.log('installing',this.id);
    if(this.source == 'git') {
        var bin = 'git';
        var cmd = [
            'clone',
            this.location,
            REPOS+'/'+this.id,
        ];
        console.log("execing",bin,cmd);
        var proc = spawn(bin,cmd);
        proc.stdout.on('data',function(data) {
            console.log("STDOUT",data.toString());
        });
        proc.stderr.on('data',function(data) {
            console.log("STDERR",data.toString());
        });
        proc.on('close',function(code) {
            console.log("exited with code",code);
            if(cb) cb(null);
        });
    }

    if(this.source == 'http'){
        console.log("source is http",this.location);
        var outpath = REPOS;
        var req = http.get(this.location)
            .on('response',function(res){
                //console.log("response");
                /*
                res.on('error',function(err){
                    console.log('err');
                })
                .on('end',function(){
                    console.log("fisinshed download");
                })
                */
                res.pipe(unzip.Extract({path:outpath}))
                .on('close',function() {
                    console.log("finished inflating");
                    if(cb) cb(null);
                })
            });
        req.end();
    }
}

var libs = [];
exports.loadLibraries = function() {
    var datapath = "/Users/josh/projects/arduino-data/libraries";
    fs.readdirSync(datapath).forEach(function(file){
        var str = fs.readFileSync(datapath+'/'+file).toString();
        var lib = JSON.parse(str);
        lib.isInstalled = isInstalled;
        lib.install = install;
        lib.getIncludePath = getIncludePath;
        libs.push(lib);
    });
    return {
        search: function(str,cb) {
            str = str.toLowerCase();
            var results = [];
            libs.forEach(function(lib) {
                if(lib.name.toLowerCase().indexOf(str)>=0) {
                    results.push(lib);
                    return;
                }
                for(var i=0; i<lib.tags.length; i++) {
                    if(lib.tags[i].toLowerCase().indexOf(str)>=0) {
                        results.push(lib);
                        return;
                    }
                }
            });
            cb(results);
        },

        getById: function(id) {
            for(var i=0; i<libs.length; i++) {
                if(libs[i].id == id) {
                    return libs[i];
                }
            }
            return null;
        },
    }
}
