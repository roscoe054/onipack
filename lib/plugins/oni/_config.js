var _config = exports._config = {
    getSourceFormat: function() {
        return "amd"
    }, // can be "cjs"
    // dependence: true, // 默认计算依赖
    keepVersion: false, // 默认不保留组件版本目录
    outputFormat: "amd", // 默认输出格式
    combo: false, // 默认不合并
    versionFile: "version.json",
    http: "https://github.com/roscoe054/avalon.oniui.git",
    ssh: "git@github.com:roscoe054/avalon.oniui.git", // git 仓库地址
    fekitModule: "git@gitlab.corp.qunar.com:fed/oniui.git", // fekit module仓库地址
    fekitPack: "git@gitlab.corp.qunar.com:yuhao.ju/oniui-beta-pack.git", // fekit oni pack version 仓库地址
    commboPlugins: ["css.js", "text.js"], // 打包需要的插件
    pattern: ["*/*.html", "*/*.js", "*.swf", "*/*.css", "avalon.getModel.js", "!*case*", "!*test*", "!pages/*", "!mocha/*", "!.git", "!*.doc.html", "!*.ex*.html", "!mmRouter/contacts*", "!highlight/*", "!tree/treeMenu*", "!*.log.html", "!test/*", "!style/*"],
    fekitModuleIndexJSBuilder: function(opt) {
        return utils.runCMD("node ./build.js", opt)
    }, // build fekit module的index.js的函数，返回一个promise
}