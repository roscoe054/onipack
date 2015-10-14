// release
var Release = require("../../common/release.js").Release,
    fsex = require("fs-extra"),
    fs = require("fs"),
    Releaser = new Release({
        // 准备
        prepare: function(resolve, reject) {
            var me =this
            // 调用parent的方法
            var prom = me.callParentMethod("prepare"),
                ppath = me.getPluginPath()
            if(me.unrelease) return resolve()
            prom.then(function() {
                Logger.log("prepare to fetch oni source")
                var store = $config.store + me.type,
                    plugins = me.commboPlugins || []
                // copy plugins
                plugins.forEach(function(plugin) {
                    var file = store + "/" + plugin
                    if(!fs.existsSync(file)) fs.writeFileSync(file, fs.readFileSync(ppath + "plugins/" + plugin))
                })
                var inner = me.fetchCode()
                inner.then(resolve)
                return inner
            })
            prom.catch(reject)
        },
    })

for(var i in Releaser) exports[i] = Releaser[i]
