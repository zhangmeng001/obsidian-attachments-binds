import { App, PluginSettingTab,Notice,Setting } from "obsidian"
import AttachmentsBindsPlugin from "./main"

// 插件页面布局 

export interface AttachmentsBindsSettingsType {
  enableAttachmentBind: boolean;
  // enableAbsolutePathBind: boolean;//绝对路径设置，未启用
  attachmentDir:string;
  attachmentDirPalaceholder:string;
  attachmentIgnoreType:string;
}

// 初始值
export const attachmentsBindsSettings:AttachmentsBindsSettingsType = {
  enableAttachmentBind: true,
  // enableAbsolutePathBind: false,
  attachmentDir:'',
  attachmentDirPalaceholder:'attachments',
  attachmentIgnoreType:''
}

export class AttachmentsBindsSettingTab extends PluginSettingTab {
    plugin: AttachmentsBindsPlugin
    constructor(app: App, plugin: AttachmentsBindsPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }
    display() {
        const { containerEl } = this
        containerEl.empty()
        // 插件标题
        containerEl.createEl("h1", { text: "Attachments Binds" });
        // 副标题
        const basicDiv = containerEl.createEl("div");
        basicDiv.createEl("h2", { text: "常规设置"});
        //声明
        const webdavLongDescDiv = basicDiv.createEl("div", {
          cls: "settings-long-desc",
        });
        webdavLongDescDiv.createEl("p", {
          text: "声明：本插件目前仅支持各笔记附件的父级文件夹名称相同，例如：每个附件都是放置在attachments文件夹下，且移动后附件引用方式不变。对于形如“![[01-工作笔记/attachments/0000.png|left]]”这种形式的应用，目前更新后可能会出现丢弃掉“|”后面部分对附件属性的设置的风险。",
          cls: "base-disclaimer",
        });

        //是否绑定路径
        new Setting(basicDiv)
        .setName("是否绑定附件")
        .setDesc("绑定附件后，当移动笔记时，会判断当前笔记所在目录的附件目录中是否包含笔记中引用的附件，如果包含，则进行移动，不包含则默认为对其他附件的服用，不做处理。")
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.enableAttachmentBind)
            .onChange(async (val) => {
              // 增加判断，当点击开启时，弹窗提示开启，关闭时提示关闭
              this.plugin.settings.enableAttachmentBind = val;
              await this.plugin.saveSettings();
              if(val==true){
                new Notice("开启绑定！");
              }else{
                new Notice("关闭绑定！");
              }
            });
        });
        
        // //绝对路径设置
        // new Setting(basicDiv)
        // .setName("是否绑定绝对路径")
        // .setDesc("绑定绝对路径后，当移动笔记时，附件也会移动到笔记所在目录的附件目录下。适用于使用绝对路径引用附件文件情况，例如：/生活笔记/a.md附件使用的连接：/生活笔记/attachments/a.png")
        // .addToggle((toggle) => {
        //   toggle
        //     .setValue(this.plugin.settings.enableAbsolutePathBind)
        //     .onChange(async (val) => {
        //       this.plugin.settings.enableAbsolutePathBind = val;
        //       await this.plugin.saveSettings();
        //       new Notice("绑定附件成功！");
        //     });
        // });
        
        //配置附件文件夹名称
        new Setting(containerEl)
        .setName("附件文件夹名称：")
        .setDesc("配置附件所在文件夹名称,默认为：attachments 。【注意】此配置项是全局配置，适用所有笔记。")
        .addText((value) => {
          value
            .setPlaceholder(this.plugin.settings.attachmentDirPalaceholder)
            // .setValue(this.plugin.settings.attachmentDir)
            .onChange( (value) => {
              this.plugin.settings.attachmentDir = value;
              // this.plugin.saveSettings();
              // new Notice("配置附件文件夹名称："+value);
            });
        });

        //通过哪种方式过滤附件，指定附件格式还是排除附件格式
        // new Setting(containerEl)
        // .setName("附件排除格式：")
        // .setDesc("配置了排除的附件格式后，移动笔记时，对应的附件格式应用会被忽略，【注意】此配置项是全局配置，适用所有笔记.支持正则表达式，多个附件格式使用英文分号(;)分割。")
        // .addToggle((toggle) => {
        //   toggle
        //     .setValue(this.plugin.settings.enableAttachmentBind)
        //     .onChange(async (val) => {
        //       // 增加判断，当点击开启时，弹窗提示开启，关闭时提示关闭
        //       this.plugin.settings.enableAttachmentBind = val;
        //       await this.plugin.saveSettings();
        //       if(val==true){
        //         new Notice("开启绑定！");
        //       }else{
        //         new Notice("关闭绑定！");
        //       }
        //     });
        // });

        //配置绑定的附件格式
        // new Setting(containerEl)
        // .setName("绑定的附件格式：")
        // .setDesc("配置了绑定的附件格式后，移动笔记时，对应的附件格式会被绑定到笔记，【注意】此配置项是全局配置，适用所有笔记.支持正则表达式，多个附件格式使用英文分号(;)分割。")
        // .addText((value) => {
        //   value
        //     .setValue(this.plugin.settings.attachmentIgnoreType)
        //     .onChange(async (value) => {
        //       this.plugin.settings.attachmentIgnoreType = value;
        //       await this.plugin.saveSettings();
        //       new Notice("配置绑定附件格式："+value);
        //     });
        // });

        //配置附件排除格式
        new Setting(containerEl)
        .setName("附件排除格式：")
        .setDesc("配置了排除的附件格式后，移动笔记时，对应的附件格式应用会被忽略，【注意】此配置项是全局配置，适用所有笔记.支持正则表达式，多个附件格式使用英文分号(;)分割。")
        .addText((value) => {
          value
            .setValue(this.plugin.settings.attachmentIgnoreType)
            .onChange(async (value) => {
              this.plugin.settings.attachmentIgnoreType = value;
              // await this.plugin.saveSettings();
              // new Notice("配置过滤附件格式："+value);
            });
        });

        new Setting(containerEl)
        .setName("保存配置")
        .setDesc("点击保存按钮保存配置。")
        .addButton((button) => {
          button.setButtonText("保存");
          button.onClick(async () => {
            await this.plugin.saveSettings();
            new Notice("配置保存成功！");
          });
        });

      
    }
}