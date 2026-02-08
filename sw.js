// sw.js
// 后台脚本 - 处理扩展功能
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'openSidePanel',
    title: '打开学习笔记',
    contexts: ['action']
  });

  // 初始化存储数据
  chrome.storage.local.get({studyNotes: []}, (result) => {
    if (!result.studyNotes || result.studyNotes.length === 0) {
      // 添加示例笔记
      const exampleNotes = [
        {
          id: Date.now(),
          title: '欢迎使用学习笔记',
          body: '这是一个示例笔记，您可以编辑或删除它。\n\n功能说明：\n- 点击"+"新建笔记\n- 点击笔记标题查看内容\n- 支持标签分类和搜索\n- 可以导出为文本文件',
          tags: ['示例', '欢迎'],
          updated: Date.now()
        }
      ];
      chrome.storage.local.set({studyNotes: exampleNotes});
    }
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openSidePanel') {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// 处理扩展图标点击
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});