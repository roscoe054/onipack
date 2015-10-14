var fs = require("fs"),
    shimFunc = function() {}
if(fs.existsSync("web/build.js")) {
    shimFunc = require("../../../web/build.js").shim
}
var Pack = require("../../common/pack.js").Pack,
    madge = require("madge"),
    Packer = new Pack({
        // 计算依赖
        dependenceFilter: function(dependence, uiname) {
            var obj = {
                    //uiname: {}, // 主文件的依赖
                    //files: {},// 其他文件的依赖，比如tree这种
                }, me = this
                obj[uiname] = {}
            for(var i in dependence.tree) {
                var deps = dependence.tree[i]
                // main file like avalon.tree
                // other file like avalon.tree.async
                // var fileDepend = i.split("avalon." + uiname + "\.")[1]
                // if(fileDepend) obj[fileDepend] = {}
                deps.forEach(function(item) {
                    var parts = item.replace(/^[\.\/]+/g, "").split("/")
                    if(parts.length == 2) {
                        // depend on other ui
                        item = parts[0]
                        // if(fileDepend) obj[fileDepend][item] = "*"
                        obj[uiname][item] = "*"
                    } else if(parts[0] == "avalon" || item.indexOf("../") == 0) {
                        item = parts[0]
                        me.log("[depend][common]" + item)
                        // me.data.common.push(item)
                        me.data.common[item] = "*"
                        // return
                    // depend on file in uiname/
                    // 暂时不处理最后一种情况，暂时不做分文件
                    } 
                    // if(fileDepend) obj[fileDepend][item] = "*"
                    // obj[uiname][item] = "*"
                })
            }
            return obj
        },
        // 合并的时候忽略的文件
        jsFileFilter: function(file) {
            var uiname = file.split("/"),
                // 处理coupledatepicker等文件
                script = shimFunc(uiname[0], "js").join(";"),
                uinameMaybe = file.split("/")[1]
            if(uinameMaybe) {
                uinameMaybe = uinameMaybe.replace(/^avalon\./g, "").split(".")[0]
                uinameMaybe = shimFunc(uinameMaybe, "js").join(";").indexOf(file) == -1
            }
            if(script.indexOf(file) == -1 && uinameMaybe) return "忽略这个文件"
            return file.match(/(old|_|app\.js$)/)
        },
        prepare: function(rs, rj) {
            var me = this
            me.__packlist = {"chameleon": "*"}
            me.callParentMethod("prepare").then(function() {
                rs()
            }).catch(rj)
        }
    })
for(var i in Packer) exports[i] = Packer[i]
