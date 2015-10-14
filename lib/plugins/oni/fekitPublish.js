// 发布oni代码到fekit
var Processor = require("../../processor.js").Processor,
    fsex = require("fs-extra"),
    extend = require("extend"),
    jsonFormat = require("json-format")

function writeJSON(file, json) {
    fsex.writeFileSync(file, jsonFormat(json), {encoding: "utf8"})
}

function Publish(options) {
    this.extend(options)
}

Publish.prototype = new Processor({
    // here we fetch code
    prepare: function(resolve, reject) {
        // default publish to fekit
        var target = this.t || this.target || "fekitModule",
            me = this
        if(target != "fekitPack") {
            target = "fekitModule"
        } else {
            me.packCombo = true // pack version combo to one file
        }
        me.t = me.target = target
        var ssh = me[target]
        if(!ssh) return reject("在oni的_config.js里没有配置有效的git地址" + target)
        // let do fetch
        me.fetchCode(ssh, me.type + target).then(function() {
            // here we load fekit.config
            var dir = me.gitdir + "/"
            me.fekitConfigDir = dir + "fekit.config"
            var fekitConfig = fsex.readFileSync(me.fekitConfigDir, {encoding: "utf8"})
            fekitConfig = utils.parseJSON(fekitConfig)
            if((fekitConfig instanceof Error) || !fekitConfig.version) return reject(fekitConfig)
            me.fekitConfig = fekitConfig //挂载上fekit.config
            if(!me.config) me.config = {}
            if(me.version) me.config.version = me.version // 定制版本号
            // 加一个小版本号
            if(!me.config.version || !(me.config.version + "").match(/[0-9]+\.[0-9]+\.[0-9]+/)) me.config.version = fekitConfig.version.replace(/[0-9]+$/g, function(num) {
                return parseInt(num) + 1
            })
            // load exports
            me.exportsJSONDir = dir + "/config/exports.json"
            var exportsJSON = fsex.readFileSync(me.exportsJSONDir)
            exportsJSON = utils.parseJSON(exportsJSON)
            if(!(exportsJSON instanceof Array)) return reject("转换exports.json出错")
            var arr = [], hash = {}
            exportsJSON.forEach(function(ui) {
                hash[ui] = true
            })
            if(me.exports && me.exports.add) {
                var add = (me.exports.add + "").split(",")
                add.forEach(function(ui) {
                    var ps = ui.split("@") // 可以指定一个特殊的版本
                    arr.push(ui)
                    if(hash[ps[0]]) {
                        hash[ps[0]] = "update version"
                    } else {
                        hash[ps[0]] = true
                    }
                })
            }
            if(me.exports && me.exports.remove) {
                var remove = (me.exports.remove + "").split(",")
                remove.forEach(function(ui) {
                    var ps = ui.split("@")
                    if(!hash[ps[0]]) return
                    hash[ps[0]] = false
                })
            }
            exportsJSON = []
            for(var i in hash) {
                if(hash[i] === true) arr.push(i)
                if(hash[i]) exportsJSON.push(i)
            }
            me.exportsJSON = exportsJSON
            me.fekitConfig = fekitConfig
            me.listToPack = arr.length ? arr : "*" // 需要被打包的组件
            resolve()
        }).catch(reject)
    },
    on: function(resolve, reject) {
        var me = this
        // extend(true, me.fekitConfig, me.config)
        // // write exports.json
        // writeJSON(me.exportsJSONDir, me.exportsJSON)
        // // write fekit.config
        // writeJSON(me.fekitConfigDir, me.fekitConfig)
        // // build
        // me.fekitModuleIndexJSBuilder({
        //     cwd: me.gitdir
        // })
        // 利用pack的逻辑
        var packer = new Processor({
                type: me.type,
                processor: "pack",
                list: me.listToPack,
                outputFormat: "nodejs",
                combo: !!me.packCombo,
                // 重写打包，替换为拷贝
                after: function() {
                    // copy code
                    var pack = me.target == "fekitPack",
                        cmd = pack ? "cp -rf " + packer.data.tmpName + "/main.js " + me.gitdir + "/src/index.js && " + "cp -rf " + packer.data.tmpName + "/main.css " + me.gitdir + "/src/index.css" : "cp -rf " + packer.data.tmpName + "/* " + me.gitdir + "/src"
                    // cp
                    utils.runCMD(cmd).then(function() {
                    // publish
                        var publishCommand = "fekit publish && git add . && git commit -m \"auto publish " + packer.type + "@" + me.config.version + "\""
                        publishCommand = "git add . && git commit -m \"auto publish " + packer.type + "@" + me.config.version + "\""
                        publishCommand += " && git pull origin master && git push origin master"
                        extend(true, me.fekitConfig, me.config)
                        // write exports.json
                        writeJSON(me.exportsJSONDir, me.exportsJSON)
                        // write fekit.config
                        writeJSON(me.fekitConfigDir, me.fekitConfig)
                        var pro, opt = {
                            cwd: me.gitdir
                        }
                        // fekit module需要 build
                        if(me.target == "fekitModule" && me.fekitModuleIndexJSBuilder) {
                            // build
                            pro = me.fekitModuleIndexJSBuilder(opt)
                        } else {
                            pro = me.promise(function(rs) {rs()})
                        }
                        // test
                        // publishCommand = "git status"
                        // test
                        return utils.runCMD(publishCommand, opt)
                    // add && commit && push
                    }).then(function() {
                        me.data = me.data || {}
                        me.data.log = me.packType + "@" + me.config.version + "已拷贝到仓库" + me.gitdir + "，请clone到本地执行fekit publish手动发布"
                        // fsex.removeDir不靠谱
                        return utils.runCMD("rm -rf " + packer.data.tmpName).then(function() {
                            resolve()
                        })
                    }).catch(reject)
                }
            }, "heighLevel")
        packer.loadPocessor()
        me.packType = packer.type
    },
    done: function() {
        var me = this
        console.log(me.data.log)
    }
})
var Publisher = new Publish({})
for(var i in Publisher) exports[i] = Publisher[i]

