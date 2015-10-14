var program = require("commander"),
    runner = require("./main.js").run

program
    .version("0.0.1")

program
    .command("pack <uitype> <uinames>")
    .option("-f, --outputFormat <outputFormat>", "输出格式，默认为源格式，例如oniui，为\"amd\"，可选\"amd\",\"nodejs\"")
    .option("-c, --combo <combo>", "是否合并代码，默认true")
    .option("-d, --dependence <dependence>", "是否包含依赖，默认true")
    .option("-p, --prefix <prefix>", "用来替换oni前缀的字符串，默认不替换")
    .option("-r, --replacer <replacer>", "指定替换规则，如 http://`https://,xxx`ccc，多个规则之间用,分隔")
    .option("-s, --https <https>", "转换出https版本，就是把字体的地址替换成https")
    .option("-e, --exclude <exclude>", "uiname@version 会略掉组件")
    .description("打包组件: pack oni tree@*,menu@1.0.1")
    .action(function (uitype, uinames, options) {
        var opts = {
                type: uitype,
                list: uinames,
                processor: "pack"
            }, 
            keys = ["outputFormat", "combo", "dependence", "prefix", "replacer", "https", "exclude"]
        for(var i in keys) {
            var key = keys[i]
            if(key in options) opts[key] = options[key]
        }
        runner(opts)
    })

program
    .command("release <uitype> [uiname@version]")
    .option("-e, --exclude <exclude>", "uiname@version 会略掉组件")
    .option("-m, --comment <comment>", "发布说明")
    .description("发布组件: release oni 0.0.1 可以指定组件名字，意思只发布该组件，需要手动指定依赖组件的发布，例如a@0.2.2,b@0.2.3或者a+b@0.2.2")
    .action(function (uitype, version, options) {
        version = version || "0.0.1"
        runner({
            type: uitype,
            version: version,
            processor: "release",
            exclude: options.exclude,
            comment: options.comment,
        })
    })

program
    .command("unrelease <uitype> [uiname@version]")
    .option("-e, --exclude <exclude>", "uiname@version 会略掉组件")
    .description("取消已发布的组件: unrelease oni 0.0.1 可以指定组件名字，只卸载指定的组件，例如a@0.2.2,b@0.2.3或者a+b@0.2.2")
    .action(function (uitype, version, options) {
        version = version || "0.0.1"
        runner({
            type: uitype,
            version: version,
            processor: "release",
            unrelease: true,
            exclude: options.exclude,
        })
    })

program
    .command("server [httpPort]")
    .option("-p, --httpPort <httpPort>", "端口")
    .description("起服务器")
    .action(function(httpPort, opts) {
        require("./server.js").run(httpPort || opts && opts.httpPort)
    })

// program.command("fekitPublish <uitype>")
//     .option("-f, --fekit <fekit>", "修改fekit.config内的配置")
//     .option("-t, --target <target>", "发布到fekit modules的模块，oniFekit || oniPack")
//     .description("发布到fekit modules")
//     .action(function(uitype, options) {
//         console.log(options)
//     })

program.parse(process.argv)