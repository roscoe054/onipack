function g(id) {
        return document.getElementById(id)
}
var lock,
    domain = window.config && window.config.server || "",
    treeModel, __msg = {}
var vmodel = avalon.define("download", function(vm) {
    vm.outputFormat = ""

    vm.type = ""

    vm.combo = []

    vm.dependence = []

    vm.https = []

    vm.types = ["oni", "kami"]

    vm.$formats = {
        oni: ["amd", "nodejs"],
        kami: ["nodejs"],
        "": []
    }
    vm.checkall = []

    vm.fs = []

    vm.tree = {
        children: [],
        view: {
            showIcon: false,
            nameShower: function(leaf) {
                var msg = leaf.description || ""
                if(msg) {
                    msg = __msg[msg] || ""
                    msg = msg.split("`")
                    msg = " 备注：" + msg[0] + (msg[1] && avalon.filters.date(msg[1], "yyyy-MM-dd hh"))
                }
                return leaf.name + msg
            }
        },
        edit: {
            enable: false
        },
        check: {
            enable: true,
            chkboxType: {
                N: "s",
                Y: "p"
            }
        },
        callback: {
            onCheck: function(e) {
                var leaf = e.leaf
                if(leaf.isParent) return
                var children = leaf.$parentLeaf.children
                for(var i = 0, len = children.length; i < len; i++) {
                    if(children[i].name != leaf.name && children[i].checked) {
                        e.vm.checkNode(children[i], false)
                    }
                }
            }
        },
        onInit: function(vmodel) {
            treeModel = vmodel
        }
    }
    vm.$skipArray = ["tree"]

    vm.download = function() {
        if(!vm.type || lock) return
        var list = [],
            sl = avalon.vmodels.tree2.getCheckedNodes(),
            dict = {}
        avalon.each(sl, function(i, node) {
            var ui, v = "*"
            if(node.level == 0) {
                ui = node.name
            } else {
                ui = node.$parentLeaf.name
                v = node.name
            }
            dict[ui] = v
        })

        for(var i in dict) {
            list.push(i + "@" + dict[i])
        }

        list = list.join(",")

        if(!list) return alert("没有选择组件")
        lock = true
        var opts = {
            combo: !!vm.combo.length,
            type: vm.type,
            dependence: !!vm.dependence.length || !!vm.combo.length,
            https: !!vm.https.length || !!vm.https.length,
            outputFormat: vm.outputFormat,
            list: list
        }
        var download = window.specialDownload|| window.open
        var cb = function() {
            lock = false
        }
        download(domain + "data/pack?" + queryToString(opts), cb)
        if(download == window.open) return cb()
    }
    vm.msg = []
})
function queryToString(obj) {
    var str = []
    for(var i in obj) {
        str.push(i + "=" + obj[i])
    }
    return str.join("&")
}
vmodel.$watch("type", function(v) {
    vmodel.fs = vmodel.$formats[v]
    vmodel.outputFormat = vmodel.fs[0]
    if(v) loadVersion(v)
})
vmodel.combo.$watch("length", function(v) {
    if(v) vmodel.dependence = ["on"]
})
vmodel.checkall.$watch("length", function(v) {
    if(treeModel) {
        treeModel.checkAllNodes(false)
        if(v) {
            avalon.each(treeModel.children, function(i, node) {
                node.checked = true
                var lastChild = node.children[node.children.length - 1]
                if(lastChild) lastChild.checked = true
            })
        }
    }
})
function loadVersion(type) {
    var ajax = window.specialAjax || avalon.ajax
    ajax({url:domain + "data/version?type=" + type}).done(function(res){
        if(type != vmodel.type) return
        var children = res.children
        __msg = res._msg || {} 
        // 新本已修改数据格式
        if(!children) {
            var tmp = res
            children = []
            if(window._formater) children = window._formater(res)
        }
        if(__msg) {
            var arr = []
            for(var i in __msg) {
                var msg = __msg[i].split("`")
                msg = (msg[1] ? avalon.filters.date(msg[1], "yyyy-MM-dd HH") + " ：" : "") + msg[0]
                arr.push(msg)
            }
            vmodel.msg = arr.reverse()
        }
        avalon.each(children, function(i, item) {
            if(item.children && item.children.length) item.isParent = true
        })
        if(avalon.vmodels.tree2) {
            avalon.vmodels.tree2.reset(children)
        } else {
            vmodel.tree.children = children
        }
    })
}
vmodel.type = "oni"
