// 打包
var Processor = require("../processor").Processor,
    fs = require("fs"),
    madge = require("madge"),
    fsex = require('fs-extra'),
    globExpand = require('glob-expand'),
    Parent = new Processor({
        prepare : function(resolve, reject) {
            var me = this, 
                uilist = {},
                packlist = me.__packlist || {"chameleon": "*"}, // 引入通用css
                data = me.data,
                uiSelect,
                excludeMap = me.versionFormat(me.exclude, "exclude")
            me.log("load version tree")
            var tree = this.getTree("source"),
                msg = me.__msg = tree._msg,
                _ = tree._,
                hash = me.__hash = me._formater._hashBuilder(tree) || {}
            tree = {
                children: this._formater._formater(tree)
            }
            // 建立字典
            tree && tree.children && tree.children.forEach(function(ui) {
                var uiname = ui.name
                uilist[uiname] = ui.children
            })
            // 解析list语法
            // version @* 最新版本 @1.*.* 1的最新版本
            // uiname uiname@指定组件 *@所有组件
            if(!this.list.forEach) this.list = this.list.split(",")
            if(this.list && this.list.length) {
                this.list.forEach(function(item) {
                    item = item.trim().split("@")
                    var uinames = item[0].trim() || "*", // empty == all
                        version = (item[1] || "").trim() || "*" // empty == newest
                    uinames = uinames.split(",")
                    uinames.forEach(function(ui) {
                        // ui not found
                        if(ui != "*" && !uilist[ui]) {
                            me.warn("[pack]" + ui + " not found")
                        } else {
                            packlist[ui] = version
                            uiSelect = true
                        }
                    })
                })
            }
            if(!uiSelect) {
                return reject(["[pack]invalid ui select", 0])
            }
            var packAll = packlist["*"]
            // 计算打包列表
            tree && tree.children && tree.children.forEach(function(ui) {
                var uiname = ui.name
                if(packAll && !(uiname in packlist)) packlist[uiname] = packAll
            })
            // 计算版本号
            utils.versionComputer(packlist, uilist, me)
            // 移除
            for(var i in excludeMap) {
                var v = excludeMap[i]
                if(!v || v == "*" || packlist[i] == v) delete packlist[i]
                if(i == "*") return reject(["[pack]invalid ui select", 0])
            }
            data.uilist = uilist
            data.packlist = packlist
            // 调用计算依赖的逻辑
            if(me.judge(me.combo)) me.dependence = true // 合并代码，必须要解析依赖
            if(!this.judge(this.dependence) || !this.getDependence) return resolve()
            this.getDependence.apply(this, [resolve, reject])
        },
        getDependence: function(rs, rj) {
            var me = this
            resolveDependence(me)
            rs()
        },
        // 转化逻辑
        on: function(rs, rj) {
            var me =this,
                data = me.data,
                packlist = data.packlist,
                path = me.getStorePath(),
                tmpName = "tmp/_copy" + me.guiID() + "/",
                outputFormat = me.outputFormat, // 输出格式
                sourceFormat = me.getSourceFormat(),
                dowloadSource = me.outputFormat === sourceFormat,// 是否下载源码
                combo = me.judge(me.combo), // 合并打包
                inCaseOfError,
                files = [],
                replacer = me.prefix && me.prefix != "oni",
                ignore = "!*.sh,!*.string!*.config!*.html,!*.php,!*.json,!*.scss,!*.xml,!*.md,!*.source,!test.*,!*.png,!*.jpg,!*.gif,!*.jpeg"

            var msg = me.__msg,
                hash = me.__hash,
                msgs = []
            for(var ui in packlist) {
                if(ui in hash) {
                    var hashItem = hash[ui][packlist[ui]],
                        msgItem = msg[hashItem]
                    msgItem = msgItem && msgItem.split("`")
                    msgItem && msgs.push({
                        msg: ui + "@" + packlist[ui] + " " + msgItem[0],
                        t: msgItem[1],
                    })
                }
            }
            msg = me.__msg = null
            hash = me.__hash = null
            me.__msg = msgs

            me.replacer = me.replacer && me.replacer.split(",") || []
            me.replacer.forEach(function(rule, index) {
                var rule = rule.split("~")
                me.replacer[index] = function(str) {
                    return (str || "").replace(new RegExp(rule[0], "g"), rule[1] || "")
                }
            })
            if(me.https) me.replacer.push(function(str) {
                return (str || "").replace(/http:\/\/source.qunarzz.com\/fonts/g,"https://source.qunarzz.com/fonts")
            })
            replacer = replacer || me.replacer.length
            data.tmpName = tmpName
            if(!dowloadSource) {
                fs.mkdirSync(tmpName)
                // do transfer
                var converter = me.loadConverter(sourceFormat, outputFormat)
                if(!converter) {
                    return rj(["converter from " + sourceFormat + " to " + outputFormat + " not found ", 700])
                }
                converter = new converter({
                    synchronization: true, 
                    template: outputFormat, 
                    // staticFiles: "*.png,*.gif,*.jpg,*.jpeg"
                })
                data._packlist = {}
                var spath
                function doConvert(list, isCommon) {
                    for(var ui in list) {
                        if(me.ignoreKeyValue(ui, list)) continue
                        if(isCommon) {
                            spath = ui + ".js"
                        } else {
                            spath = ui + "/" + list[ui]
                            fs.mkdirSync(tmpName + ui)
                        }

                        converter.config.path = path + spath
                        converter.config.ignore = ignore
                        converter.config.dstPath = tmpName + (isCommon ? "" : ui)
                        converter.build()
                        data._packlist[ui] = ""
                        converter.files.forEach(function(file) {
                            files.push((isCommon ? "" : ui + "/") + file)
                        })
                    }
                }
                data.common.avalon = false // 去除avalon
                doConvert(data.common, "common")
                doConvert(packlist)
            // 合并代码，或者需要替换class前缀，都需要拷贝代码
            } else if(combo || replacer) {
                data._packlist = {}
                var ignoreList = ['**/*'].concat(ignore.replace(/\!/g, "!**/").split(","))
                for(var ui in packlist) {
                    if(me.ignoreKeyValue(ui, packlist)) continue
                    var spath = ui + "/" + packlist[ui]
                    fsex.copySync(path + spath, tmpName + ui)
                    data._packlist[ui] = ""
                }
                // include text & css plugin
                if(sourceFormat === "amd" && combo) {
                    data.common["text"] = ""
                    data.common["css"] = ""
                }
                if(combo) {
                    for(var ui in data.common) {
                        if(me.ignoreKeyValue(ui, packlist)) continue
                        var spath = ui + ".js"
                        fsex.copySync(path + spath, tmpName + spath)
                    }
                }
                files = files.concat(globExpand({
                    cwd: tmpName,
                    filter: 'isFile'
                }, ignoreList))
            } else {
                // 把common也放到包里面
                if(me.judge(me.dependence)) {
                    var cm = me.data.common,
                        p = me.data.packlist
                    for(var i in cm) {
                        if(i == "avalon") continue
                        p[i] = ""
                    }
                }
                return rs()
            }
            // 合并代码或需要做替换
            if(combo || replacer) {
                // amd use r.js?
                // node use browserfy
                var cssFiles = [], imgFiles = [],
                    main = "./" + tmpName + "main", _pack = {}, jsFiles = []
                files.forEach(function(file) {
                    // js file
                    if(combo && file.match(/\.js$/g)) {
                        // 忽略掉老的文件，以及_这样的备份
                        if(me.jsFileFilter && me.jsFileFilter(file)) return
                        jsFiles.push(file)
                    } else if(combo && file.match(/\.css$/g)) {
                        // cssFiles.push(file)
                        var res = fs.readFileSync(tmpName + file)
                        res = res.toString("utf8")
                        fs.writeFileSync(main + ".css", me.cssFilter(res), {flag: "a+"})
                        _pack["main.css"] = ""
                    } else if(!file.match(/\.(html|string|htm|js|css)$/g)) {
                        // imgFiles.push(file)
                        var img = combo ? utils.up(file) : file,
                            source = tmpName + file,
                            target = tmpName + img
                        fsex.copySync(source, target)
                        _pack[img] = ""
                    } else if(!combo){
                        // copy and replace
                        var res = fs.readFileSync(tmpName + file)
                        res = res.toString("utf8")
                        fs.writeFileSync(tmpName + file, file.match(/\.css$/g) ? me.cssFilter(res) : me.jsFilter(res, combo))
                        _pack[file] = ""

                    }
                })
                if(!combo) {
                    data._packlist = _pack
                    return rs()
                }
                fsex.outputFileSync(main + ".js", me.writeMainJS(jsFiles, outputFormat))
                if(outputFormat === "nodejs") {
                    var browserify = require("browserify")({
                        basedir: "./" + tmpName,
                    })
                    browserify.add("./main.js")
                    browserify.bundle(function(err, buf) {
                        if(!err) {
                            var res = buf.toString("utf8")
                            fsex.outputFileSync(main + ".js", me.jsFilter(res, combo))
                            _pack["main.js"] = ""
                            data._packlist = _pack
                            rs()
                        } else {
                            rj(["pack using browserify failed with " + err, 800])
                        }
                    })
                } else {
                    var requirejs = require('requirejs')
                    // 移除目录里的package.json
                    if(fs.existsSync("./package.json")) fs.unlinkSync("./package.json")
                    requirejs.optimize({
                        baseUrl: tmpName,
                        name: "main",
                        out: main + ".js"
                    }, function(res) {
                        var content = fsex.readFileSync(main + ".js", {encoding: "utf8"})
                        fsex.outputFileSync(main + ".js", me.jsFilter(content))
                        _pack["main.js"] = ""
                        data._packlist = _pack
                        rs()
                    }, function(err) {
                        rj(["pack using requirejs failed with " + err, 801])
                    })
                }
            } else {
                rs()
            }
        },
        // go packing
        after: function(rs, rj) {
            var me =this,
                data = me.data,
                packlist = data._packlist || data.packlist,
                path = data._packlist ? data.tmpName : this.getStorePath(), // 是否启用临时目录
                fname = "tmp/" + this.guiID(),
                folders = []
            for(var i in packlist) {
                if(me.ignoreKeyValue(i, packlist)) continue
                var p = path + "/" + i + (packlist[i] ? "/" + packlist[i] : "")
                folders.push(p)
            }
            if(!folders.length) return rj(["[pack]invalid ui select", 0])
            var res = utils.pack(fname, me.packType),
                output = res[1],
                archive = res[0]
            fname = res[2]

            output.on('close', function() {
                data.file = fname
                // 移除临时目录
                utils.runCMD("rm -rf " + data.tmpName).then(function() {
                    me.__file = fname
                    rs()
                }).catch(rj)
                me.data = data = null
            })

            archive.on('error', function(err) {
                me.data = data = null
                fs.unlinkSync(fname)
                rj(["[pack]" + err, 600])
            })

            archive.pipe(output)
            // here we compile, then pack
            var regUI = new RegExp(me.type + "\\/", "g")
            // pack common
            folders.forEach(function(folder) {
                if(fs.existsSync(folder + ".js")) folder = folder + ".js"
                var isDir = fs.statSync(folder).isDirectory(),
                    dest = folder.replace(/(tmp\/|_copy[0-9]+\/)/g, "").replace(regUI, ""),
                    dests = dest.split(path.split("/" + me.type + "/")[0])
                if(dests.length > 1) dest = dests[1].replace(/^[\/]+/g, "")
                if(folder.match(/\.css\.map/g)) return
                if(isDir) {
                    archive.bulk([
                          me.packFilter({ expand: true, dest: dest, cwd: folder, src: ["*.js", "*.html", "*.string", "*/*.js", "*/*.string", "*.css"] })
                    ])
                } else {
                    archive.file(folder, { name: me.packFilter(dest) })
                }
            })
            // 保存一个版本信息文件到压缩包
            archive.append(JSON.stringify(data.packlist), {name: (me.type == "kami" ? "kami" : "oniui") + ".info"})
            if(me.__msg && me.__msg.length) archive.append(JSON.stringify(me.__msg), {name: "install.info.tmp"})
            archive.finalize()
        },
        packFilter: function(obj) {
            // 版本号是不是写成数字比较好...
            var me = this, reg = /\/([0-9]+\.[0-9]+\.[0-9]+)[\/]*$/g
            if(me.judge(me.keepVersion)) return obj
            if(obj.replace) return obj.replace(reg, "/")
            obj.dest = obj.dest.replace(reg, "/")
            return obj
        },
        loadConverter: function(sourceFormat, outputFormat) {
            // here only amd => cjs or nodejs supported
            if(sourceFormat == "amd" && (outputFormat in  {"nodejs": 1})) {
                var modulesCat = require("modules-cat/src/code/Cat")
                return modulesCat
            }
        },
        writeMainJS: function(arr, outputFormat) {
            return this.template[outputFormat] && this.template[outputFormat](arr) || ""
        },
        template: {
            "nodejs": function(arr) {
                var str = ""
                arr.forEach(function(file) {
                    str += "require(\"./" + file.split(/.js$/g)[0] +"\");"
                })
                return str
            },
            "amd": function(arr) {
                var str = "define(["
                for(var i = 0, len = arr.length; i < len; i++) {
                    str += "'" + arr[i].split(/.js$/g)[0] + "'" + (i == len - 1 ? "" : ", ")
                }
                return str + "], function(){})"
            }
        },
        cssFilter: function(content) {
            var me = this
            if(this.prefix) content = content.replace(/\.oni\-/g, "." + this.prefix + "-")
            if(me.replacer.length) me.replacer.forEach(function(func) {
                content = func(content)
            })
            // 移除css map
            content = content.replace(/\/\*[^\r\n]+\*\//g, "")
            return content
        },
        jsFilter: function(content, combo) {
            var me = this
            if(this.prefix) content = content.replace(/oni\-/g, this.prefix + "-")
            if(me.replacer.length) me.replacer.forEach(function(func) {
                content = func(content)
            })
            if(this.outputFormat === "nodejs" && combo) content = content.replace(/[\s\S]require[\s\S]/g, function(mat) {
                if(mat.match(/^[\.\'\"]|[a-zA-Z_\-\'\"]$/g)) return mat
                return mat.split("require").join("innerRequire")
            })
            return content
        },
        ignoreKeyValue: function(key, item) {
            if(key === "*" || item[key] === false) return true
        }
    })

function Pack(options) {
    this.extend(options)
    this.Parent = Parent
}
function resolveDependence(me, dependenceToResolve) {
    if(dependenceToResolve === false) return
    var dependence, 
        packlist = me.data.packlist,
        dependenceToResolve = dependenceToResolve || Object.create(me.data.packlist),
        uilist = me.data.uilist,
        storePath = me.getStorePath(),
        dependenceToPack = false // 迭代
    for(var i in dependenceToResolve) {
        if(me.ignoreKeyValue(i, dependenceToResolve)) continue
        var dir = storePath + i + "/",
            ver = dependenceToResolve[i]
        // 实时计算依赖
        var f = me.getSourceFormat(ver)
        // 加载version文件，获取显式依赖
        var versionJson = JSON.parse(utils.readFileSync([dir, ver, me.versionFile].join("/")))
        // file found depen
        // kami里面拼写错误
        if(versionJson.error != 403 && (versionJson.dependence || versionJson.dependance)) {
            dependence = versionJson.dependence || versionJson.dependance
            if(dependence instanceof Array) {
                var tmp = {}
                dependence.forEach(function(depend) {
                    var parts = depend.split("@"),
                        name = parts[0].trim(),
                        ver = (parts[1] || "").trim() || "*",
                        reg = utils.versionToReg(ver)
                    // already match
                    if(dependenceToResolve[name] && dependenceToResolve[name].match(reg)) {
                        // do nothing
                    } else if(dependenceToResolve[name]){
                        me.warn("[pack]unmatched version " + ver + " and " + dependenceToResolve[name] + " for " + me.type + "." + name)
                        tmp[name] = ver
                        data.unmatched.push({name: name, version: [ver, packlist[name]]})
                    } else {
                        // in the same store,like oni
                        if(uilist[name]) {
                            tmp[name] = ver
                        // not found in oni ui,like avalon
                        } else {
                            me.warn("[pack]" + name + " is not found in " + me.type)
                            data.notFound.push({
                                name: name,
                                version: ver
                            })
                        }
                    }
                })
                utils.versionComputer(tmp, uilist)
                dependence = tmp
            }
            for(var i in dependence) {
                // 不在打包列表里的依赖，放到dependenceToPack，进行下一轮迭代
                if(!(i in packlist)) {
                    dependenceToPack = dependenceToPack || {}
                    dependenceToPack[i] = dependence[i]
                }
                packlist[i] = dependence[i]
            }
        }
        // amd & cjs use madge to compute dependence
        if(me.judge(me.dependence) && (f == "amd" || f == "nodejs")){
            dependence = madge( dir + ver, {
                format: f == "nodejs" ? "cjs" : f
            })
            if(me.dependenceFilter) dependence = me.dependenceFilter(dependence, i)
            var tmp = {}
            for(var i in dependence) {
                var deps = dependence[i]
                // load dependence
                for(var j in deps) {
                    if(!(j in packlist)) tmp[j] = deps[j]
                }
            }
            utils.versionComputer(tmp, uilist)
            dependence = tmp
            for(var i in dependence) {
                // 不在打包列表里的依赖，放到dependenceToPack，进行下一轮迭代
                if(!(i in packlist)) {
                    dependenceToPack = dependenceToPack || {}
                    dependenceToPack[i] = dependence[i]
                }
                packlist[i] = dependence[i]
            }
        }
    }
    // 迭代
    resolveDependence(me, dependenceToPack)
}
Pack.prototype = Parent

exports.Pack = Pack