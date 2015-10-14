var fsex = require('fs-extra'),
    rq = require("request-promise"),
    Promise = require('promise')

var run = exports.run = function(str, path) {
    var relatedIcos = str.match(/\&\#x[^\;]+\;/g)
    if(relatedIcos) {
        var obj = {}
        relatedIcos.forEach(function(ico) {
            var key = ico.replace(/[\&\#x\;]+/g, "")
            obj[key] = ""
        })
        // get config.json
        rq({
            uri: "http://gitlab.corp.qunar.com/jifeng.yao/qicon/raw/master/svg/config.json"
        }).then(function(res) {
            var res = JSON.parse(res)
            for(var i in res) {
                var item = res[i],
                    code = item.code
                if(code in obj) {
                    (function(i) {
                        rq({
                            uri: "http://gitlab.corp.qunar.com/jifeng.yao/qicon/raw/master/svg/" + i + ".svg"
                        }).then(function(res) {
                            fsex.writeFileSync(path + i + ".svg", res)
                        })
                    })(i)
                } 
            }
        })
    }
}

run(fsex.readFileSync("tmp/xxx/main.js", {encoding: "utf8"}), "svgs/")