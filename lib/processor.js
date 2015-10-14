// base on
var Promise = require('promise'),
    fs = require("fs"),
    _formater = require("../web/dataFormat.js")

function Processor(options, highLevel) {
    this.extend(options)
    if(highLevel) {
        this.options = options
        this.init()
    }
}
Processor.prototype = {
    _formater: _formater,
    // 拉代码
    fetchCode: function(ssh, type, kami) {
        var me = this,
            gitdir = me.gitdir = $config.store + "@" + (type || me.type)
        if(kami) gitdir += "/" + kami
        var cmd = (!fs.existsSync(gitdir) ? "git clone " + (ssh || me.ssh) + " " + gitdir + "&& cd " + gitdir : "cd " + gitdir + " && git checkout . && git pull origin master") // 回滚未保存的改动
        // return me.promise(function(rs) {rs()})
        return utils.runCMD(cmd, {
            cwd: "./"
        })
    },
    versionFormat: function(version, exclude) {
        var versionMap = {},
            version = version && version.split(",") || []
        version.forEach(function(v, index) {
            v = v.split("@") // 切分组件名字和版本号
            var ui = v[0],
                ver = v[1]
            if(v.length >= 2) {
                ui = ui.split("+")
                ui.forEach(function(u, loop) {
                    versionMap[u] = ver
                })
            } else {
                if(exclude) {
                    versionMap[ui] = ""
                } else {
                    ver = ui
                    versionMap[""] = ver
                }
            }
        })
        return versionMap
    },
    init: function() {
        this.data = {
            status: 0,
            _error: [],
            _msg: [],
            _warn: [],
            unmatched: [],
            notFound: [],
            // common: []
            common: {},
        }
    },
    warn: function(msg) {
        this.data._warn.push(msg)
        Logger.warn(msg)
    },
    log: function(msg) {
        this.data._msg.push(msg)
        Logger.log(msg)
    },
    error: function(msg, status) {
        this.data.status = status || 0
        if(this.data.status) {
            this.data._error.push(msg)
            Logger.error(msg)
        } else {
            this.warn(msg)
        }
    },
    // load processor from plugins
    loadPocessor: function() {
        var me = this,
            pname = this.getPluginPath() + this.processor,
            _config = this.getPluginPath() + "_config.js",
            prom = me.promise(function(resolve, reject) {
                fs.exists( pname + ".js", function(exists) {
                    if(exists) {
                        me.data.pname = pname
                        resolve()
                    } else {
                        reject(["[plugin]" + pname + " not found", 403])
                    }
                })
            })
            prom.then(function() {
                var data = me.data,
                    pname = !data.status && data.pname
                if(pname) {
                    try {
                        var processor = require("../" + pname + ".js")
                    } catch(e) {
                        return me.promise(function(rs, rj) {
                            rj(e)
                        })
                    }
                    _config = fs.existsSync(_config) ? require("../" + _config)._config : {}
                    for(var i in _config) {
                        $config[i] = _config[i]
                    }
                    me.extend(_config)
                    me.extend(processor)
                    var chain = ["prepare", "before", "on", "after"]
                    function pop() {
                        if(!chain.length) {
                            me.done.call(me)
                        } else {
                            var item = chain.shift()
                            prom = prom.then(function() {
                                return me.promise(function() {
                                    me[item].apply(me, arguments)
                                }).then(function() {
                                    pop()
                                }).catch(function(e) {
                                    var err = me.isError(e) ? e : (e && e.join ? e[0] : e)
                                    me.error("[promise]" + err, typeof e[1] != "undefined" ? e[1] : 500)
                                    me.done()
                                })
                            })
                        }
                    }
                    pop()
                    return prom
                }
            }).catch(function(e) {
                var err = me.isError(e) ? e : e[0]
                me.error("[promise]" + err, typeof e[1] != "undefined" ? e[1] : 500)
                me.done()
            })
    },
    prepare: common,
    before: common,
    on: common,
    after: common,
    done: function() {
        if(this.data.status == 0) this.log(this.data.pname + " excute success")
    },
    promise: function(fn) {
        return new Promise(fn)
    },
    promiseAll: function(arr) {
        return Promise.all(arr)
    },
    getPluginPath: function() {
        return $config.plugins + this.type + "/"
    },
    getStorePath: function() {
        return $config.store + this.type + "/"
    },
    getVersionTreeFile: function() {
        return this.getStorePath() + "_ui.tree.json"
    },
    getTree: function(doNotFormat) {
        var ct = utils.readFileSync(this.getVersionTreeFile(), {encoding: "utf8"}),
            res = {}
        try {
            res = JSON.parse(ct)
            if(!doNotFormat) {
                res = _formater._formater(res)
                res = {
                    children: res,
                }
            }
        } catch(e) {

        }
        return res
    },
    extend: function(options) {
        var highLevelOptions = this.options
        for(var i in options) {
            if(highLevelOptions && (i in highLevelOptions)) continue 
            this[i] = options[i]
        }
    },
    callParentMethod: function(methodName) {
        var me =this,
            prom = this.promise(function(rs, rj) {
                var par = me.Parent
                par[methodName].apply(me, [rs, rj])
            })
        return prom
    },
    guiID: function() {
        return +(new Date())
    },
    judge: function(str) {
        return str && str != "false" || typeof str == "undefined"
    },
    isError: function(e) {
        return e instanceof Error
    }
}
function common(resolve, reject) {
    resolve()
}
exports.Processor = Processor