'use strict';

module.exports = {
    load() {
        // 当插件加载时执行
        console.log('笔记插件已加载');
    },

    unload() {
        // 当插件卸载时执行
        console.log('笔记插件已卸载');
    },

    messages: {
        'note:open-panel'() {
            // 打开笔记管理面板
            Editor.Panel.open('note-panel');
        }
    }
};