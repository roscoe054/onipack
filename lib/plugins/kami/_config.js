var _config = exports._config = {
    getSourceFormat: function() {
        return "nodejs"
    }, // can be "cjs"
    // dependence: true, // 默认计算依赖
    keepVersion: false,// 默认不保留组件版本目录
    outputFormat: "nodejs",// 默认输出格式
    combo: false, // 默认不合并
    versionFile: "kami.config",
    _http: "http://gitlab.corp.qunar.com/kami/",
    _ssh: "git@gitlab.corp.qunar.com:kami/",
    uilist: "demo,panel,pagelist,slidermenu,list,searchlist,grouplist,doublelist,imagelazyload,selectlist,suggest,base,core,kamibuilder,map,switchable,loading,alert,util,qapp-adapter,switch,docSite,template,accordion,rating,avalon-adapter,calendar,select,localData,class,numbers,popselect,popcalendar,tips,overlay,dialog,confirm".replace(/(demo|docSite|kamibuilder),/g, ""),
    pattern: ["src", "*.*", "!.git", "!.git*"]
}