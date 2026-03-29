export const translations = {
  'zh-CN': {
    // Toolbar
    'toolbar.slideCount': '张幻灯片',
    'toolbar.conceptCount': '个概念',
    'toolbar.zoomIn': '放大',
    'toolbar.zoomOut': '缩小',
    'toolbar.toggleGrid': '切换网格',
    'toolbar.deselect': '取消选择',
    'toolbar.help': '帮助',
    'toolbar.settings': '设置',

    // Help dialog
    'help.title': '画布操作提示',
    'help.shiftClick': '+ 点击节点连接',
    'help.spaceDrag': '+ 拖拽平移画布',
    'help.cmdClick': '+ 点击多选节点',
    'help.altClick': '+ 点击解释术语',

    // Canvas hints
    'hint.shiftClick': 'Shift + 点击卡片连接概念',
    'hint.spaceDrag': 'Space + 拖拽平移画布',
    'hint.cmdClick': '⌘ + 点击多选卡片',

    // Chat panel
    'chat.title': 'AI 助手',
    'chat.placeholder': '输入消息...',
    'chat.send': '发送',

    // Modals
    'modal.uploadSlide': '上传 Slides',
    'modal.importConcept': '导入 AI 概念',
    'modal.importDesc': '从对话中复制 AI 生成的概念数据',
    'modal.close': '关闭',

    // Settings
    'settings.title': '设置',
    'settings.language': '语言',
    'settings.theme': '主题',
  },
  'en': {
    // Toolbar
    'toolbar.slideCount': 'slides',
    'toolbar.conceptCount': 'concepts',
    'toolbar.zoomIn': 'Zoom in',
    'toolbar.zoomOut': 'Zoom out',
    'toolbar.toggleGrid': 'Toggle grid',
    'toolbar.deselect': 'Deselect',
    'toolbar.help': 'Help',
    'toolbar.settings': 'Settings',

    // Help dialog
    'help.title': 'Canvas Shortcuts',
    'help.shiftClick': '+ Click nodes to connect',
    'help.spaceDrag': '+ Drag to pan canvas',
    'help.cmdClick': '+ Click to multi-select nodes',
    'help.altClick': '+ Click to explain terms',

    // Canvas hints
    'hint.shiftClick': 'Shift + Click cards to connect',
    'hint.spaceDrag': 'Space + Drag to pan',
    'hint.cmdClick': '⌘ + Click to multi-select',

    // Chat panel
    'chat.title': 'AI Assistant',
    'chat.placeholder': 'Type a message...',
    'chat.send': 'Send',

    // Modals
    'modal.uploadSlide': 'Upload Slides',
    'modal.importConcept': 'Import AI Concepts',
    'modal.importDesc': 'Copy AI-generated concept data from chat',
    'modal.close': 'Close',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations['zh-CN']

export const languages: { code: Language; name: string }[] = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en', name: 'English' },
]
