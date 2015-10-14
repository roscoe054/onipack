var Release = require("../../common/release.js").Release,
    Releaser = new Release({
        // 拉代码去
        prepare: function(resolve, reject) {
            var me =this,
                unrelease = me.unrelease
            // 调用parent的方法
            me.callParentMethod("prepare").then(function() {
                me.gitdir = $config.store + "@kami"
                if(unrelease) return resolve()
                Logger.log("prepare to fetch kami source")
                
                var uilist = me.uilist.split(","),
                    uiMap = {

                    },
                    excludeVersionMap = me.excludeVersionMap,
                    versionMap = me.versionMap
                uilist.forEach(function(item) {
                    if(item) uiMap[item] = true
                })
                var all = versionMap[""]
                for(var i in excludeVersionMap) {
                    delete versionMap[i]
                }
                if(all) {
                    delete versionMap[""]
                    for(var i in versionMap) {
                        if(i && !(i in uiMap)) return reject("不存在组件：" + i)
                    }
                    for(var i in uiMap) {
                        if(!(i in versionMap)) versionMap[i] = all
                    }
                }
                // here go fetch code
                var promises = [],
                    _ssh = me._ssh
                for(var i in versionMap) {
                    i = i.toLowerCase()
                    var prom = me.fetchCode(_ssh + i + ".git", "kami", i)
                    promises.push(prom)
                }
                if(!promises.length) return reject("未发布任何组件")
                me.promiseAll(promises).then(function() {
                    resolve()
                }).catch(reject)
            })
        }
    })

for(var i in Releaser) exports[i] = Releaser[i]