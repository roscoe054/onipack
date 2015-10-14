#### ***使用说明***

node index.js release oni version - 发布一个version指定的*.*.*版本到store

node index.js server port - 起一个pack服务器

node index.js pack oni uinames - 打包uinames指定组件及版本

node index.js -h - 查看帮助

node index.js pack -h 查看打包帮助

#### 自动发布说明

node main.js fekitPublish oni - 发布代码到oniui，oniui-pack（现在只是拷贝，不自动提交和fekit publish），如果需要publish，需要到store/@${type}fekit${Module|Pack}提交和发布改动

--config.dependencies.avalon=1.4.5 - 修改fekit.config内依赖的avalon的版本

--exports.add=uiname@version,uiname2@version2 - 向config/exports.json内添加新的组件

--exprots.remove=uiname - 移除config/exports.json内的组件

#### 发布命令
node index.js pack oni button@*,tab@*,dialog@*,tooltip@*,scrollbar@*,loading@*,notice@*,menu@*,datepicker@*,coupledatepicker@*,daterangepicker@*,dropdown@*,miniswitch@*,switchdropdown@*,checkboxlist@*,textbox@*,mask@*,json@*,live@*,mmPromise@*,store@*,hotkeys@*,pager@*,spinner@*,simplegrid@*,smartgrid@*,validation@* -f nodejs -c true

