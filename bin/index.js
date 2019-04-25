#!/usr/bin/env node 

  const fs = require('fs');
  const path = require('path');
  const program = require('commander'); //自动的解析命令和参数，用于处理用户输入的命令
  const chalk = require('chalk'); //可以给终端的字体加上颜色
  const ora = require('ora'); //下载过程久的话，可以用于显示下载中的动画效果
  const child_process = require('child_process');
  const inquirer = require('inquirer'); //通用的命令行用户界面集合，用于和用户进行交互
  const shell = require('shelljs'); //NodeJS中使用UNIX shell 命令，即允许在脚本中写shell命令
  const symbols = require('log-symbols'); //可以在终端上显示出 √ 或 × 等的图标
  const download = require('download-git-repo'); //下载并提取 git 仓库，用于下载项目模板
  const handlebars = require('handlebars'); //模板引擎，将用户提交的信息动态填充到文件中

  program.version('1.1.0', '-v, --version') //会将-v和--version添加到命令行中，调用时可通过带上该参数获取该脚手架的版本号（命令 -v/--version）
  .command('<name>') //定义初始化命令,name参数必传，作为项目文件名
  .action(name => { //action是执行command时的回调，项目生成过程发生在该回调中
    console.log(name);

    if (!fs.existsSync(name)) {
      console.log('正在创建项目...');
      inquirer.prompt([ //参数为对象数组，用于在命令行逐条提示用户输入
        {
            name: 'description',
            message: '请输入项目描述'
        },
        {
            name: 'author',
            message: '请输入作者名称'
        }
      ]).then(answers => { //answers为用户输入参数组成的对象
        console.log(answers);
        const spinner = ora('正在下载模板...\n');
        spinner.start();
        child_process.exec('git clone https://github.com/stevekeol/react-redux-generator-template', function(err, stdout, stderr) { //运行命令进行下载模块的方式3;参考文末
          if (err) {
            spinner.fail();
            console.log(symbols.error, chalk.red('模板下载失败'))
            console.log(err);
          } else {
            spinner.succeed();

            //更改项目文件名
            shell.mv(__dirname + '/react-redux-generator-template', __dirname + '/' + name); //将在当前目录刚下载成功的模板，重命名为用户输入的项目名

            //更改模板工程中package.json的字段;而非脚手架index.js对应的package.json
            const filename = `${name}/package.json`;
            const meta = {
              name,
              description: answers.description,
              author: answers.author
            }
            if (fs.existsSync(filename)) {
              const content = fs.readFileSync(filename).toString();
              let dt = JSON.parse(content); //将项目的package.json文件先字符串化，再解析成json对象，用于动态修改一些字段
              dt.name = '{{name}}'; //只要文件中有该样式的模板字段（{{name}}）,均可利用handlebars.compile和传入参数，来预编译替换
              dt.description = '{{description}}'
              const result = handlebars.compile(JSON.stringify(dt, null, 2))(meta); //JSON.stringify接受三个参数;第二个参数可以为数组/过滤函数;第三个参数控制结果字符串里的间距（数字/制表符）
              																																			//预编译
              fs.writeFileSync(filename, result);
              console.log(symbols.success, chalk.green(`${filename}初始化完成`));
            } else {
              console.log(symbols.error, chalk.red(`${filename}不存在`));
            }

            // //更改webpack.config.js
            // const filename_webpack = `${name}/webpack.config.js`;
            // if (fs.existsSync(filename_webpack)) {
            //   const content_webpack = fs.readFileSync(filename_webpack).toString();
            //   const result_webpack = handlebars.compile(content_webpack)(meta); //JSON.stringify接受三个参数;第二个参数可以为数组/过滤函数;第三个参数控制结果字符串里的间距（数字/制表符）
            //   fs.writeFileSync(filename_webpack, result_webpack);
            //   console.log(symbols.success, chalk.green(`${filename_webpack}初始化完成`));
            // } else {
            //   console.log(symbols.error, chalk.red(`${filename_webpack}不存在`))
            // }

            // //更改app/app.jsx
            // const filename_app_appjsx = `${name}/app/app.jsx`;
            // if (fs.existsSync(filename_app_appjsx)) {
            //   const content_app_appjsx = fs.readFileSync(filename_app_appjsx).toString();
            //   const result_app_appjsx = handlebars.compile(content_app_appjsx)(meta); //JSON.stringify接受三个参数;第二个参数可以为数组/过滤函数;第三个参数控制结果字符串里的间距（数字/制表符）
            //   fs.writeFileSync(filename_app_appjsx, result_app_appjsx);
            //   console.log(symbols.success, chalk.green(`${filename_app_appjsx}初始化完成`));
            // } else {
            //   console.log(symbols.error, chalk.red(`${filename_app_appjsx}不存在`))
            // }                        
          }
        })
      })
    } else {
      console.log(symbols.error, chalk.red('项目已存在'));
    }
  })
  program.parse(process.argv); //解析命令行中的参数,解析出name, 并传入action回调
