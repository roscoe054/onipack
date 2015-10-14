var argv = global.av = require("minimist")(process.argv), // {_:[1, 2, 3, 4], key: value}
    $config = global.$config = require("./config.js").config,
    Logger = global.Logger = require("./lib/logger.js").Logger,
    utils = global.utils = require("./lib/util.js").utils,
    Processor = require("./lib/processor.js").Processor,
    printPid = global.printPid = function(pro) {
        var pro = pro || process
        if(pro.pid) Logger.log("pid=" + pro.pid)
    },
    run = exports.run = function(options) {
        var processor = new Processor(options, "heighLevel")
        processor.loadPocessor()
    }
// run in common
if(argv["_"][1].match(/main\.js/g)) {
    printPid()
    var _ = argv["_"],
        type = _[3],
        processor = _[2],
        list = _.slice(4)[0]
    if(!type || !processor) {
        return Logger.error("invalid command")
    }
    if(list) argv.list = list
    argv.type = type
    argv.processor = processor
    delete argv._
    exports["run"](argv)
}