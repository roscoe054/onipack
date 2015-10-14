var express = require("express")
var app = express()
var fsex = require("fs-extra")
var fs = require("fs")
var cluster = require('cluster')
var numCPUs = require('os').cpus().length
var config = require("./config.js").config
var userInfo = config.release || {}

var run = exports.run = function(port) {
    port = port ? port : 3000

    app.get("/", function(req, res){
        res.send(fsex.readFileSync("index.html", {encoding: "utf8"}))
    })

    // app.get("/tmp/:file", function(req, res) {
    //     var file = req.params.file || ""
    //     if(fs.existsSync("tmp/" + file)) {
    //         res.send(fsex.readFileSync("tmp/" + file))
    //     } else {
    //         res.sendStatus(404)
    //     }
    // })
    app.use("/web", express.static('web'))

    app.get("/data/:action", require("./processor.js").Process)

    app.get("/ajax", function(req, res) {
        var query = req.query,
            action = query.action,
            data = {
                status: 250,
                message: "请先登录"
            }
        if(query.user !== userInfo.user || query.password !== userInfo.password) {
            data.message = "用户名还是密码错了"
        } else {
            if(action == "login") {
                data = {
                    status: 0
                }
            } else if(action == "release" || action == "fekitPublish") {
                return require("./processor.js").Process(req, res)
            } else {
                data = {
                    status: 251,
                    message: "接口不存在"
                }
            }
        }
        res.send(data)
    })

    app.listen(port)
    
    console.log("ui server started at port " + port)
}
if(process.argv[1].match(/server\.js/g)) {
    if (cluster.isMaster) {
        var max = Math.min(2, numCPUs)
        for(var i = 0; i < max; i++) {
            cluster.fork()
        }
    } else {
        run(process.argv[2])
    }
}