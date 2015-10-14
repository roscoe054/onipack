;(function() {
    var ex = typeof exports == "undefined" ? window : exports
    var _each = typeof avalon == "undefined" ? function(arr, func) {
        arr.forEach && arr.forEach(function(item, i) {
            func(i, item)
        })
    } : avalon.each;
    ex._formater = function(res) {
        var children = []
        for(var ui in res) {
            if(ui.indexOf("_") == 0) continue
            var leaf = {
                    children: [],
                    name: ui
                },
                level2 = res[ui]
            _each(level2, function(i, item) {
                item = item.split("@")
                var obj = {
                    name: item[0]
                }
                if(item[1]) obj.description = item[1]
                leaf.children.push(obj)
            })
            children.push(leaf)
        }
        return children
    };
    ex._hashBuilder = function(obj, par) {
        if(!obj || obj.children) return
        var hash = par || {},
            isArray = obj instanceof Array,
            isObject = obj instanceof Object
        if(isArray) {
            _each(obj, function(i, item) {
                item = item.split("@")
                if(item[1]) hash[item[0]] = item[1]
            })
        } else if(isObject) {
            for(var i in obj) {
                hash[i] = {}
                ex._hashBuilder(obj[i], hash[i])
            }
        }
        return hash
    }
})();