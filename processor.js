var fsex = require("fs-extra")
var fs = require("fs")
var packer = require("./main.js")
var config = require("./config.js").config

function Process(req, res) {
    var query = req.query
        action = req.params.action || req.query.action
    // 加载版本数据
    if(action == "version") {
        var type = query.type,
            json = config.store + type + "/_ui.tree.json"
        if(fs.existsSync(json)) {
            res.type("application/json")
            return res.send(fsex.readFileSync(json))
        }
    } else {
        query.processor = action
        if(query.list) query.list = query.list.split(",")
        query.done = function() {
            if(action == "release" || action == "fekitPublish") {
                return res.send(this.data)
            }
            var __file = this.__file
            if(!__file) {
                res.sendStatus(404)
            } else {
                res.set('Content-Type', 'application/octet-stream');
                res.download(__file, function() {
                    fs.unlinkSync(__file)
                })
            }
        }
        return packer.run(query)
    }
    res.sendStatus(404)
    res.end()
}

exports.Process = Process