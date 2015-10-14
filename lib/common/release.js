// 发布一个版本
var Processor = require("../processor").Processor,
    expand = require("glob-expand"),
    fsex = require("fs-extra"),
    fs = require("fs")
    var Parent = new Processor({
        // 仓库初始化
        prepare: function(rs, rj) {
            this.list = this.list instanceof Array ? this.list.join(",") : this.list
            var storePath = this.getStorePath(),
                me = this,
                version = me.version = me.version || me.list
            Logger.log("checking storePath: " + storePath)
            if(!me.version) {
                return rj("发布版本号不能为空")
            }
            me.versionMap = me.versionFormat(me.version)
            me.excludeVersionMap = me.versionFormat(me.exclude, "exclude") || {}
            if(!fs.existsSync(storePath)) {
                fs.mkdirSync(storePath)
            }
            var unrelease = me.unrelease,
                versionMap = me.versionMap,
                excludeVersionMap = me.excludeVersionMap,
                patterns = me._patterns = unrelease ? [] : [].concat(me.pattern || []),
                otherWise = versionMap[""]
            if(otherWise == "*" || otherWise && !otherWise.match(/^[0-9]+\.[0-9]+\.[0-9]+/g)) return rj("版本号" + otherWise + "匹配符是非法的")
            if(!unrelease && !otherWise) {
                var i = 0, pt = patterns[i]
                while(pt) {
                    if(pt.indexOf("*") == 0) {
                        patterns.splice(i, 1)
                    } else {
                        i++
                    }
                    pt = patterns[i]
                }
            }
            if(otherWise) {
                patterns.unshift("*" + otherWise + "*")
            }
            for(var i in versionMap) {
                if(i && !(i in excludeVersionMap)) {
                    var v = versionMap[i],
                        f = i + (unrelease ? "/" + ( v == "*" ? "" : v) : "/*")
                    patterns.unshift(f)
                    if(v !== otherWise && otherWise) patterns.push("!" + f.replace(v, otherWise))
                }
            }
            for(var i in excludeVersionMap) {
                if(i) {
                    var v = excludeVersionMap[i]
                    patterns.push("!" + i + (unrelease ? "/" + ( v == "*" ? "" : v || otherWise) : "/*"))
                }
            }
            rs()
        },
        copy: function(to, from) {
            for(var i in from) {
                to[i] = from[i]
            }
        },
        // 发布逻辑
        on: function(resolve, reject) {
            var me = this,
                store = me.getStorePath(),
                gitdir = me.gitdir,
                unrelease = me.unrelease,
                versionMap = me.versionMap
            var files = expand({
                cwd: unrelease ? store : gitdir,
                globOnly: true,
                matchBase: true,
            }, me._patterns)
            me.releaseMap = {}
            if(!files.length) return reject("在" + gitdir + "没有找到匹配的文件")
            if(unrelease) {
                files.forEach(function(uis) {
                    fsex.removeSync(store + uis)
                })
            } else {
                files.forEach(function(file) {
                    var ui = file.split("/")[0],
                        version = versionMap[ui] || versionMap[""] || "",
                        tar = store + file.replace(/^[^\/]+\//g, function(mat) {
                            me.releaseMap[ui] = version
                            return mat + version + "/"
                        }),
                        source = gitdir + "/" + file
                    if(file.match(/\.css$/g)) {
                        // 移除css map
                        var ct = fsex.readFileSync(source, {encoding: "utf8"}).replace(/\/\*#[\s]+sourceMappingURL=[^\*]+\*\//g, "")
                        fsex.outputFileSync(tar, ct, {encoding: "utf8"})
                    } else {
                        fsex.copySync(source, tar)
                    }
                })
            }
            resolve()
        },
        // 构建组件版本树
        // 暂且通过扫描目录的方式来做吧
        // 扫描几百个目录应该还是很快的
        after: function(rs, rj) {
            var me = this,
                storePath = this.getStorePath(),
                files = utils.getDir(storePath).sort(function(a, b) { return utils.localCompare(a, b)}),
                tree = leafLevel_1 = {
 
                },
                oldTree = me.getTree("source"),
                hash = me._formater._hashBuilder(oldTree) || {},
                stamp = oldTree._ || 0,
                releaseMap = me.releaseMap || {},
                msg = {},
                m = []
            stamp += 1
            tree._ = stamp
            me.copy(msg, oldTree._msg || {})
            tree._msg = msg
            files.forEach(function(dir) {
                var filesLevel_2 = utils.getDir(storePath + dir + "/").sort(function(a, b) { return utils.localCompare(a, b, ".")}),
                    releaseVersion = releaseMap[dir],
                    oldReleaseHash = hash[dir]
                
                leafLevel_1[dir] = []
                filesLevel_2.forEach(function(version) {
                    if(version === releaseVersion) {
                        m.push((oldReleaseHash && oldReleaseHash[version] ? "重新" : "" ) + "发布：" + dir + "@" + releaseVersion)
                        version += "@" + stamp
                    } else if(oldReleaseHash && oldReleaseHash[version]) {
                        version += "@" + oldReleaseHash[version]
                    }
                    leafLevel_1[dir].push(version)
                })
            })
            msg[stamp] = m.join(" ") + (" " + (me.comment || "")) + "`" + (+ new Date())
            Logger.log("building version tree")
            utils.fileSync(this.getVersionTreeFile(), JSON.stringify(tree))
            rs()
        }
    })
function Release(options) {
    this.extend(options)
    this.Parent = Parent
}

Release.prototype = Parent

exports.Release = Release