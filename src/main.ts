import { Plugin, TAbstractFile ,DataAdapter ,MarkdownView, TFile, Notice } from "obsidian"
import { AttachmentsBindsSettingTab,AttachmentsBindsSettingsType,attachmentsBindsSettings } from "./setting"
import path from 'path';
// import { log } from "./moreOnLog";



// 注册插件
export default class AttachmentsBindsPlugin extends Plugin {
    settings: AttachmentsBindsSettingsType=attachmentsBindsSettings;

    async onMount(){
        // 获取 log 模块
        // this.app.log.config("file", "./log.txt");
    }
    
     // 在用户激活插件和插件更新时触发，这将是您设置插件大部分功能的地方
     async onload() {
        await this.loadSettings();
        // 加入插件设置页
        this.addSettingTab(new AttachmentsBindsSettingTab(this.app, this))
        this.settings = Object.assign(
			{},
			attachmentsBindsSettings,
			await this.loadData()
		);
        console.log('----------加载插件的配置内容：------------');
        console.log(this.settings);

        this.registerEvent(this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
            if(this.settings.enableAttachmentBind==true ){
                const fileType = this.getFileType(file.name);
                // markdown文件处理
                if(fileType == '.md'){
                    console.log('触发了rename事件');
                    console.log('移动后的笔记路径：'+file.path);
                    console.log('移动前的路经：'+oldPath);
                    const new_att_base = file.parent.path + '/' + this.settings.attachmentDir;
                    const sepraterIndex = oldPath.lastIndexOf("/");
                    const parentPath = oldPath.substring(0,sepraterIndex);//获取原路径
                    const dataAdapter = this.app.vault.adapter;
                    const oldChildren = await dataAdapter.list(parentPath);//attachments路径
                    // console.log(oldChildren);
                    // oldChildren.folders;
                    //获取源路径下所有的文件夹，例如：0:"01-性能测试/attachments"
                    //todo 声明一个集合（集合是k-v结构，k是附件名，v是路径），记录移动过的附件名称，集合中存在的就是已经移动过的，不在移动，只替换名称
                    let handleAttMap = new Map();//已处理的附件集合
                    const attachmentPath: string[] = [];
                    for (const item of oldChildren.folders) {
                        if (item.contains(this.settings.attachmentDir)) {
                            attachmentPath.push(item);
                        }
                    }
                    
                    const  tf = this.app.vault.getAbstractFileByPath(file.path);
                    if(tf!= null&& tf instanceof TFile){
                        // const tFile = new TFile(tf.path, tf.stat);
                        let content = await this.app.vault.read(tf);
                        // console.log('笔记内容-->');
                        // console.log(content);
                        // 所有的笔记附件
                        const attachments = await  this.findAttachments(content);
                        // console.log(attachments);
                        //附件路径
                        // todo 不存在的附件，跳过，不修改路径
                        // const attachmentPath = oldPath.substring(0,oldPath.lastIndexOf('/'));
                        // 当前笔记同级attachment路径下的附件
                        const att_all = (await dataAdapter.list(attachmentPath[0])).files;

                        attachments.forEach( item => {
                            console.log('笔记附件：'+item);

                            const srcAttachment = this.app.vault.getAbstractFileByPath(item) as TFile;
                            if(srcAttachment){//原附件存在

                                // 截取附件引用：目录2/attachments/00-test.png|left，“|”前面的部分
                                const item_name =  item.substring(item.lastIndexOf('/')+1,item.indexOf('|') > -1 ?item.indexOf('|'):item.length);
                                // const item_name = item && item.indexOf('|') > -1 ? item.substring(0, item.indexOf('|')) : item;
                                
                                // const flag = this.isAbsolutPath(item);
                                //不分绝对路径和相对路径了，直接判断这个附件的地址是不是在当前目录下有，有的话就进行处理，没有就不处理
                                // if(att_all.includes(item)){
                                //     this.moveAttachment();
                                // };
                                att_all.forEach(async att => {
                                    if(att.contains(item_name) && !handleAttMap.get(item_name)){
                                        const handleAttPath = this.moveAttachment(att,(new_att_base+'/'+item_name),item_name);
                                        console.log('处理后的附件路径:%s',handleAttPath);
                                        content = content.replaceAll(item,handleAttPath);//替换笔记中附件的引用地址
                                        // console.log('替换后的笔记内容：%s',new_content);
                                        // console.log(`笔记 %s 成功更新！`,tf.name);
                                        handleAttMap.set(item_name,handleAttPath);
                                    }
                                });
                            }else{//原附件不存在
                                return;
                            }
                        });
                        
                        await this.app.vault.modify(tf, content);
                        new Notice(`笔记 "${tf.name}" 成功更新！🎉🎉`);
                    }
                }else{
                    console.log('非markdown，不进行处理！');
                }


            }else{
                console.log('AttachmentBind 插件未开启,无法移动附件！');
            }

            
        }));



    }

    // 在用户禁用插件时触发，插件所调用的任何资源必须在这里得到释放，以防止 Obsidian 的性能受到影响
    onunload() {
    }

    //保存配置
    async saveSettings() {
        await this.saveData(this.settings);
        console.log('----------要保存的内容：------------');
        console.log(this.settings);
    }

    //加载配置
    async loadSettings() {
        this.settings = Object.assign(
            {},
            attachmentsBindsSettings,
            await this.loadData()
        );
    }

    // 移动附件
    moveAttachment(sourcePath : string, destinationPath :string,attName:string){
        console.log('附件的源路径：'+sourcePath);
        console.log('附件的新路径：'+destinationPath);
        console.log('附件名称：'+attName);
        // 获取要移动的文件
        const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath) as TFile;
        const destinationFile = this.app.vault.getAbstractFileByPath(destinationPath) as TFile;
        // 如果要移动的文件存在
        if (sourceFile) {

            //如果目标文件存在相同名称附件
            //todo 考虑笔记中多次应用一个附件，移动多次问题
            if(destinationFile){
                const attSubfix = attName.substring(attName.lastIndexOf('.'));
                const attPrefix = attName.substring(0,attName.lastIndexOf('.'));
                const new_attName = attPrefix+'_'+this.getDate()+attSubfix;
                console.log('目标路径存在相同名称文件，重命名为：%s',new_attName);
                destinationPath = destinationPath.replace(attName,new_attName);
                
                attName = new_attName;
            }
        
            // 如果目标目录不存在，则创建目标目录
            if (!this.app.vault.getAbstractFileByPath(destinationPath)) {
                this.app.vault.createFolder(destinationPath);
                console.log('目标路径不存在，创建目录：%s',destinationPath);
            }
        
            // 移动文件
            this.app.vault.copy(sourceFile,destinationPath);
            this.app.vault.delete(sourceFile,true);
        
            console.log(attName + ' moved successfully.');
        } else {//原引用文件不存在
            console.warn('The file does not exist.');
        }
        return destinationPath;
    }

    //查找附件 
    async findAttachments(text: string): Promise<string[]> {
        // 匹配所有附件引用，![[]]用法,[[01-工作笔记/attachments/测试文件.pdf]]和markdown图片用法：![]()
        const regex = /!\[\[([^\]]+)\]\]|!\[.*\]\((.*)\)|\[\[([^\]]+)\]\]/g;
        const matches = text.matchAll(regex);
        const attachments: string[] = [];
        
        for (const match of matches) {
          // 获取匹配到的文件名
          const fileName = match[1];
          attachments.push(fileName);
        }
      
        return attachments;
      }

    //判断是不是绝对路径,true-是绝对路径，false-相对路径
    isAbsolutPath(attachmentsPath: string):boolean {
        let flag = false;
        const index = attachmentsPath.indexOf(this.settings.attachmentDir);
        //obsidian相对路径一般有两种写法：1、"attachments/0000.png|200"；2、"0000.png|200"；其他的为绝对路径："01-工作笔记/attachments/0000.png"
        if(index>=0){
            flag = true;
        }

        return flag;
    }

    // 获取文件类型
    getFileType(fileName: string):string {
        const index = fileName.lastIndexOf('.');
        const fileType = fileName.substring(index);
        return fileType;
    }

    getDate(){
        //三目运算符
        const Dates = new Date();
    
        //年份
        const Year : number = Dates.getFullYear(); 
    
        //月份下标是0-11
        const Months : any = ( Dates.getMonth() + 1 ) < 10  ?  '0' + (Dates.getMonth() + 1) : ( Dates.getMonth() + 1); 
    
        //具体的天数
        const Day : any = Dates.getDate() < 10 ? '0' + Dates.getDate() : Dates.getDate();
    
       //小时
       const Hours = Dates.getHours() < 10 ? '0' + Dates.getHours() : Dates.getHours();
    
       //分钟
       const Minutes = Dates.getMinutes() < 10 ? '0' + Dates.getMinutes() : Dates.getMinutes();
    
       //秒
       const Seconds = Dates.getSeconds() < 10 ? '0' + Dates.getSeconds() : Dates.getSeconds();
    
       //返回数据格式
       return Year + Months + Day + '_' + Hours + Minutes + Seconds; 
   }
      
}