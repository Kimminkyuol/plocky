/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import path from "path"
import {app, BrowserWindow, dialog, ipcMain, Menu, shell} from "electron"
import Store from "electron-store"
import appMenuTemplate from "./menu/app_menu_template"
import exportMenuTemplate from "./menu/export_menu_template"
import devMenuTemplate from "./menu/dev_menu_template"
import fileMenuTemplate from "./menu/file_menu_template"

import * as window from "./helpers/window"
import env from "env"
import * as jetpack from "fs-jetpack";

const store = new Store()
let mainWindow

const setApplicationMenu = () => {
    const menus = [appMenuTemplate, fileMenuTemplate, exportMenuTemplate]
    // if (env.name !== "production") {
        menus.push(devMenuTemplate)
    // }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus))
}

const initIpc = () => {
    ipcMain.on("loadFile", (event, filePath) => {
        mainWindow.loadFile(path.join(__dirname, filePath)).then()
    })

    ipcMain.on("resizeWindow", (event, width, height) => {
        mainWindow.setSize(width, height)
        mainWindow.center()
    })

    ipcMain.on("fullscreen", (event, boolean) => {
        mainWindow.setFullScreen(boolean)
    })

    ipcMain.on("openLink", (event, link) => {
        shell.openExternal(link).then()
    })

    ipcMain.on("saveFile", (event, code, extension) => {
        const fileName = store.has("projectName") ? store.get("projectName") : "untitled"
        dialog.showSaveDialog({defaultPath: path.join(app.getPath("downloads"), fileName)}).then((filePath) => {
            if (filePath.filePath) {
                store.set("filePath", filePath.filePath + extension)
                jetpack.writeAsync(filePath.filePath + extension, Buffer.from(code, "utf16le")).then(() => {
                    event.reply("succeed", "Saved successful")
                })
            }
        })
    })

    ipcMain.on("openFile", (event) => {
        dialog.showOpenDialog({defaultPath: app.getPath("downloads"), properties: ["openFile"]}).then((filePath) => {
            if (filePath.filePaths) {
                event.reply("open", filePath.filePaths[0])
            }
        })
    })
}

const createWindow = () => {
    mainWindow = window.default("main", {
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            worldSafeExecuteJavaScript: true,
            enableRemoteModule: env.name === "test"
        }
    })

    if (store.size !== 0) {
        mainWindow.setFullScreen(true)
        mainWindow.loadFile(path.join(__dirname, "app.html")).then()
    } else {
        mainWindow.loadFile(path.join(__dirname, "setting.html")).then()
    }
}

app.on("ready", () => {
    store.clear()

    setApplicationMenu()
    initIpc()

    createWindow()

    Store.initRenderer()

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})
