const electron = require('electron')
import {
	app,
	BrowserWindow,
	Menu,
	MenuItem,
	dialog
} from 'electron'

// 菜单模板
let template = [{
		label: '查看',
		submenu: [{
			label: '重载',
			accelerator: 'CmdOrCtrl+R',
			click: function (item, focusedWindow) {
				if (focusedWindow) {
					// 重载之后, 刷新并关闭所有的次要窗体
					if (focusedWindow.id === 1) {
						BrowserWindow.getAllWindows().forEach(function (win) {
							if (win.id > 1) {
								win.close()
							}
						})
					}
					focusedWindow.reload()
				}
			}
		}, {
			label: '切换全屏',
			accelerator: (function () {
				if (process.platform === 'darwin') {
					return 'Ctrl+Command+F'
				} else {
					return 'F11'
				}
			})(),
			click: function (item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
				}
			}
		}, {
			label: '切换开发者工具',
			accelerator: (function () {
				if (process.platform === 'darwin') {
					return 'Alt+Command+I'
				} else {
					return 'Ctrl+Shift+I'
				}
			})(),
			click: function (item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.toggleDevTools()
				}
			}
		}, {
			type: 'separator'
		}, {
			label: '应用程序菜单演示',
			click: function (item, focusedWindow) {
				if (focusedWindow) {
					const options = {
						type: 'info',
						title: '应用程序菜单演示',
						buttons: ['好的'],
						message: '此演示用于 "菜单" 部分, 展示如何在应用程序菜单中创建可点击的菜单项.'
					}
					dialog.showMessageBox(focusedWindow, options, function () {})
				}
			}
		}]
	},
	{
		label: '窗口',
		role: 'window',
		submenu: [{
			label: '最小化',
			accelerator: 'CmdOrCtrl+M',
			role: 'minimize'
		}, {
			label: '关闭',
			accelerator: 'CmdOrCtrl+W',
			role: 'close'
		}, {
			type: 'separator'
		}, {
			label: '重新打开窗口',
			accelerator: 'CmdOrCtrl+Shift+T',
			enabled: false,
			key: 'reopenMenuItem',
			click: function () {
				app.emit('activate')
			}
		}]
	},
	{
		label: '帮助',
		role: 'help',
		submenu: [{
			label: '学习更多',
			click: function () {
				electron.shell.openExternal('http://electron.atom.io')
			}
		}]
	}
]
// 增加更新菜单项
function addUpdateMenuItems(items, position) {
	if (process.mas) return
	const version = electron.app.getVersion()
	let updateItems = [{
		label: `Version ${version}`,
		enabled: false
	}, {
		label: '正在检查更新',
		enabled: false,
		key: 'checkingForUpdate'
	}, {
		label: '检查更新',
		visible: false,
		key: 'checkForUpdate',
		click: function () {
			require('electron').autoUpdater.checkForUpdates()
		}
	}, {
		label: '重启并安装更新',
		enabled: true,
		visible: false,
		key: 'restartToUpdate',
		click: function () {
			require('electron').autoUpdater.quitAndInstall()
		}
	}]

	items.splice.apply(items, [position, 0].concat(updateItems))
}
// 找到reopen菜单项
function findReopenMenuItem() {
	const menu = Menu.getApplicationMenu()
	if (!menu) return
	let reopenMenuItem
	menu.items.forEach(function (item) {
		if (item.submenu) {
			item.submenu.items.forEach(function (item) {
				if (item.key === 'reopenMenuItem') {
					reopenMenuItem = item
				}
			})
		}
	})
	return reopenMenuItem
}

if (process.platform === 'darwin') {
	const name = electron.app.getName()
	template.unshift({
		label: name,
		submenu: [{
			label: `关于 ${name}`,
			role: 'about'
		}, {
			type: 'separator'
		}, {
			label: '服务',
			role: 'services',
			submenu: []
		}, {
			type: 'separator'
		}, {
			label: `隐藏 ${name}`,
			accelerator: 'Command+H',
			role: 'hide'
		}, {
			label: '隐藏其它',
			accelerator: 'Command+Alt+H',
			role: 'hideothers'
		}, {
			label: '显示全部',
			role: 'unhide'
		}, {
			type: 'separator'
		}, {
			label: '退出',
			accelerator: 'Command+Q',
			click: function () {
				app.quit()
			}
		}]
	})

	// 窗口菜单.
	template[3].submenu.push({
		type: 'separator'
	}, {
		label: '前置所有',
		role: 'front'
	})

    // 增加版本菜单
	addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
	const helpMenu = template[template.length - 1].submenu
	// 增加版本菜单
	addUpdateMenuItems(helpMenu, 0)
}

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
	global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ?
	`http://localhost:9080` :
	`file://${__dirname}/index.html`

const menu = Menu.buildFromTemplate(template)

function createWindow() {
	/**
	 * Initial window options
	 */
	mainWindow = new BrowserWindow({
		height: 563,
		useContentSize: true,
		width: 1000
	})

	mainWindow.loadURL(winURL)

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.on('ready', createWindow)

app.on('ready', () => {
	// 菜单
	Menu.setApplicationMenu(menu)
})

app.on('browser-window-created', function (event, win) {
	let reopenMenuItem = findReopenMenuItem()
	if (reopenMenuItem) reopenMenuItem.enabled = false
	win.webContents.on('context-menu', function (e, params) {
		menu.popup(win, params.x, params.y)
	})
})

app.on('window-all-closed', () => {
	let reopenMenuItem = findReopenMenuItem()
	if (reopenMenuItem) reopenMenuItem.enabled = true
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
