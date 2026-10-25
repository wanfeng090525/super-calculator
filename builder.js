/*
  electron-builder 配置
  - NSIS 安装包：安装时可选择安装路径（allowToChangeInstallationDirectory）
  - 自动生成卸载入口（控制面板可卸载）
  - 桌面 + 开始菜单快捷方式
*/
module.exports = {
  appId: 'com.zcode.supercalculator',
  productName: '超级计算器',
  directories: {
    output: 'dist'
  },
  files: [
    'main.js',
    'package.json',
    'renderer/**/*'
  ],
  win: {
    icon: 'build/icon.ico',
    target: [
      { target: 'nsis', arch: ['x64'] },   // 安装版：向导安装、可选路径、可卸载
      { target: 'zip', arch: ['x64'] }     // 绿色版：解压即用，不依赖系统 TEMP
    ]
  },
  nsis: {
    oneClick: false,                          // 非一键安装 → 向导式安装
    perMachine: false,                        // 按当前用户安装，无需管理员权限
    allowToChangeInstallationDirectory: true, // ★ 允许用户选择安装路径
    allowElevation: true,
    createDesktopShortcut: true,              // 桌面快捷方式
    createStartMenuShortcut: true,            // 开始菜单快捷方式
    shortcutName: '超级计算器',
    uninstallDisplayName: '超级计算器 ${version}',
    deleteAppDataOnUninstall: true            // 卸载时清除应用数据
  }
};
