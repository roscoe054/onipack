var fs = require("fs"),
    archiver = require('archiver'),
    path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    Promise = require("promise")
function isNumeric(e){
    return !isNaN(parseFloat(e)) && isFinite(e)
}
var utils = exports.utils = {
    getDir: function(path) {
        return fs.readdirSync(path).filter(function(file) {
            return fs.statSync(path + file).isDirectory()
        })
    },
    isNumeric: isNumeric,
    localCompare: function(a, b, split) {
        if(isNumeric(a) && isNumeric(b)) return parseInt(a) - parseInt(b) 
        if(!(a instanceof Array)) {
            a = a.toString().split(split || "")
            b = b.toString().split(split || "")
        }
        if(split) {
            return this.localCompare(a, b)
        }
        var i = 0, len = Math.min(a.length, b.length), res = 0
        while(i < len) {
            var ta = a[i], tb = b[i]
            // number like
            if(isNumeric(ta) && isNumeric(tb)) {
                res = parseInt(a) - parseInt(b)
            } else {
                res = ta.charCodeAt(0) - tb.charCodeAt(0)
            }
            if(res != 0) break
            i++
        }
        return res
    },
    fileSync: function() {
        return fs.writeFileSync.apply(null, arguments)
    },
    file: function() {
        fs.writeFile.apply(null, arguments)
    },
    readFileSync: function() {
        if(!fs.existsSync.apply(null, arguments)) return "{\"error\":403}"
        return fs.readFileSync.apply(null, arguments)
    },
    versionToReg: function(version) {
        return new RegExp("^" + version.replace(/\./g, function(mat) {
            return "\\" + mat
        }).replace(/\*/g, function(mat) {
            return "[^\\.]+"
        }), "g")
    },
    versionComputer: function(packlist, uilist, processor) {
        for(var i in packlist) {
            if(i == "*") continue
            var version = packlist[i],
                versionList = uilist[i],
                pos = false
            if(!versionList || !versionList.length) {
                packlist[i] = false
                continue // 不存在的组件
            }
            if(version.match(/^[\*\.]+$/g)) {
                // 取最大的版本号
                pos = versionList.length - 1
            } else {
                var reg = utils.versionToReg(version)
                for(var j = versionList.length - 1; j > -1; j--) {
                    if(versionList[j].name.match(reg)) {
                        pos = j
                        break
                    }
                }
            }
            if(pos === false) {
                var msg = "[pack]invalid version " + version + " for " + i
                if(processor && processor.warn) {
                    processor.warn(msg)
                } else {
                    Logger.log(msg)
                }
                packlist[i] = false
            } else {
                packlist[i] = versionList[pos].name
            }
        }
    },
    pack: function(fname, type) {
        var type = type ? type : "zip",
            fname = [fname, type].join("."),
            output = fs.createWriteStream(fname),
            options = type == "tar.gz" ? {
                gzip: true,
                gzipOptions: {
                    level: 1
                }
            }: null,
            archive = archiver(type, options)
        return [archive, output, fname]
    },
    basename: function(file) {
        return path.basename(file)
    },
    dirname: function(file) {
        return path.dirname(file)
    },
    up: function(file) {
        return file.replace(/^[^\/]+[\/]{1,2}/, "")
    },
    runCMD: function(cmd, opt) {
        console.log(cmd)
        return new Promise(function(rs, rj) {
            exec(cmd, opt, function(error, stdout, stderr) {
                var msg = stdout.toString()
                console.log("finish " + cmd + " with " + error)
                if(error !== null) {
                    rj(stderr)
                } else {
                    setTimeout(function() {
                        rs(stdout)
                    }, 1000)
                }
            })
        })
    },
    parseJSON: function(str) {
        try {
            return eval("(" + str + ")")
        } catch(e) {
            return e
        }
    }
}