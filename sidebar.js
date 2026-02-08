const $ = q => document.querySelector(q);
const listMode = $('#listMode');
const contentMode = $('#contentMode');
const search = $('#search');
const tagFilter = $('#tagFilter');
const list = $('#list');
const titleInput = $('#titleInput');
const tagsInput = $('#tagsInput');
const bodyInput = $('#bodyInput');

let notes = [];
let activeNoteId = null;
let isEditing = false;

/* 初始化 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('初始化笔记插件');
  
  // 加载笔记数据
  loadNotes();
  
  // 绑定事件
  $('#newBtn').onclick = createNewNote;
  $('#saveBtn').onclick = saveNote;
  $('#cancelBtn').onclick = showListMode;
  $('#deleteBtn').onclick = deleteNote;
  $('#exportBtn').onclick = exportNote;
  
  search.oninput = renderNoteList;
  tagFilter.onchange = renderNoteList;
  
  // 列表点击事件
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li && li.dataset.id) {
      openNote(li.dataset.id);
    }
  });
});

/* 加载笔记数据 */
function loadNotes() {
  chrome.storage.local.get({studyNotes: []}, res => {
    notes = res.studyNotes || [];
    buildTagFilter();
    renderNoteList();
  });
}

/* 构建标签过滤器 */
function buildTagFilter() {
  const tagSet = new Set();
  notes.forEach(note => {
    note.tags.forEach(tag => tagSet.add(tag));
  });
  
  tagFilter.innerHTML = '<option value="">全部标签</option>' +
    [...tagSet].sort().map(tag => 
      `<option value="${tag}">${tag}</option>`
    ).join('');
}

/* 渲染笔记列表 */
function renderNoteList() {
  const keyword = search.value.trim().toLowerCase();
  const selectedTag = tagFilter.value;
  
  // 过滤笔记
  const filteredNotes = notes.filter(note => {
    const matchesKeyword = !keyword || 
      note.title.toLowerCase().includes(keyword) || 
      note.body.toLowerCase().includes(keyword);
    
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    
    return matchesKeyword && matchesTag;
  });
  
  // 生成列表HTML
  list.innerHTML = filteredNotes.map(note => `
    <li data-id="${note.id}" class="${activeNoteId === note.id ? 'selected' : ''}">
      <div class="note-title">${escapeHtml(note.title || '无标题')}</div>
      <div class="note-tags">${escapeHtml(note.tags.join(' ') || '无标签')}</div>
      <div class="note-date">${formatDate(note.updated)}</div>
    </li>
  `).join('');
}

/* 创建新笔记 */
function createNewNote() {
  activeNoteId = null;
  isEditing = true;
  
  // 清空输入框
  titleInput.value = '';
  tagsInput.value = '';
  bodyInput.value = '';
  
  // 切换到内容模式
  showContentMode();
  titleInput.focus();
}

/* 打开笔记 */
function openNote(noteId) {
  const note = notes.find(n => n.id == noteId);
  if (!note) return;
  
  activeNoteId = noteId;
  isEditing = false;
  
  // 填充内容
  titleInput.value = note.title || '';
  tagsInput.value = note.tags.join(' ') || '';
  bodyInput.value = note.body || '';
  
  // 切换到内容模式
  showContentMode();
  updateContentModeUI(); // 确保UI状态正确
}

/* 保存/编辑笔记 */
function saveNote() {
  // 如果当前不是编辑模式，切换到编辑模式
  if (!isEditing) {
    switchToEditMode();
    return;
  }
  
  // 以下是保存逻辑
  const title = titleInput.value.trim();
  const tags = tagsInput.value.trim().split(/\s+/).filter(Boolean);
  const body = bodyInput.value.trim();
  
  // 验证输入
  if (!title && !body) {
    alert('笔记标题和内容不能同时为空');
    return;
  }
  
  const now = Date.now();
  const noteData = {
    id: activeNoteId || now,
    title: title || '无标题',
    tags: tags,
    body: body || '无内容',
    updated: now
  };
  
  if (activeNoteId) {
    // 更新现有笔记
    const index = notes.findIndex(n => n.id == activeNoteId);
    if (index !== -1) {
      notes[index] = noteData;
    }
  } else {
    // 创建新笔记
    notes.unshift(noteData);
    activeNoteId = noteData.id;
  }
  
  // 保存到存储
  chrome.storage.local.set({studyNotes: notes}, () => {
    buildTagFilter();
    renderNoteList();
    // 保存后切换到查看模式
    isEditing = false;
    updateContentModeUI();
  });
}

/* 切换到编辑模式 */
function switchToEditMode() {
  isEditing = true;
  updateContentModeUI();
  titleInput.focus();
}

/* 更新内容模式UI状态 */
function updateContentModeUI() {
  // 根据是否编辑模式设置输入框状态
  titleInput.readOnly = !isEditing;
  tagsInput.readOnly = !isEditing;
  bodyInput.readOnly = !isEditing;
  
  // 更新按钮文本和显示状态
  $('#saveBtn').textContent = isEditing ? '保存' : '编辑';
  $('#deleteBtn').style.display = activeNoteId && !isEditing ? 'block' : 'none';
  $('#cancelBtn').textContent = isEditing ? '取消' : '返回列表';
  
  // 添加/移除编辑模式类
  if (isEditing) {
    contentMode.classList.add('editing-mode');
  } else {
    contentMode.classList.remove('editing-mode');
  }
}

/* 取消编辑/返回列表 */
function cancelEdit() {
  if (isEditing) {
    // 如果正在编辑，取消编辑回到查看模式
    if (activeNoteId) {
      // 重新加载笔记内容（放弃修改）
      const note = notes.find(n => n.id == activeNoteId);
      if (note) {
        titleInput.value = note.title || '';
        tagsInput.value = note.tags.join(' ') || '';
        bodyInput.value = note.body || '';
      }
      isEditing = false;
      updateContentModeUI();
    } else {
      // 如果是新建笔记，直接返回列表
      showListMode();
    }
  } else {
    // 如果不是编辑模式，返回列表
    showListMode();
  }
}

/* 打开笔记 */
function openNote(noteId) {
  const note = notes.find(n => n.id == noteId);
  if (!note) return;
  
  activeNoteId = noteId;
  isEditing = false;
  
  // 填充内容
  titleInput.value = note.title || '';
  tagsInput.value = note.tags.join(' ') || '';
  bodyInput.value = note.body || '';
  
  // 切换到内容模式
  showContentMode();
  updateContentModeUI(); // 确保UI状态正确
}

/* 显示内容模式 */
function showContentMode() {
  listMode.hidden = true;
  contentMode.hidden = false;
  updateContentModeUI();
  
  // 强制重绘，确保布局正确
  setTimeout(() => {
    listMode.style.display = 'none';
    contentMode.style.display = 'flex';
  }, 10);
}

/* 删除笔记 */
function deleteNote() {
  if (!activeNoteId) return;
  
  if (!confirm('确定要删除这个笔记吗？此操作不可恢复。')) return;
  
  const index = notes.findIndex(n => n.id == activeNoteId);
  if (index !== -1) {
    notes.splice(index, 1);
    
    chrome.storage.local.set({studyNotes: notes}, () => {
      activeNoteId = null;
      buildTagFilter();
      renderNoteList();
      showListMode();
    });
  }
}

/* 导出笔记 */
function exportNote() {
  if (!activeNoteId) return;
  
  const note = notes.find(n => n.id == activeNoteId);
  if (!note) return;
  
  const content = `# ${note.title || '无标题'}\n标签：${note.tags.join(' ')}\n更新时间：${formatDate(note.updated)}\n\n${note.body}`;
  const blob = new Blob([content], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title || 'note'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* 显示列表模式 */
function showListMode() {
  listMode.hidden = false;
  contentMode.hidden = true;
  activeNoteId = null;
  isEditing = false;
  renderNoteList();
  
  // 强制重绘，确保布局正确
  setTimeout(() => {
    listMode.style.display = 'block';
    contentMode.style.display = 'none';
  }, 10);
}

/* 显示内容模式 */
function showContentMode() {
  listMode.hidden = true;
  contentMode.hidden = false;
  updateContentModeUI();
  
  // 强制重绘，确保布局正确
  setTimeout(() => {
    listMode.style.display = 'none';
    contentMode.style.display = 'flex';
  }, 10);
}

/* 工具函数 */
function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, s => 
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])
  );
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}