/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import {app, BrowserWindow, dialog} from "electron";

export default {
    label: "Export",
    submenu: [
        {
            label: "Export",
            accelerator: "CmdOrCtrl+E",
            click: () => {
                dialog.showOpenDialog({defaultPath: app.getPath("downloads"), properties: ["openDirectory", "createDirectory"]}).then((path) => {
                    if (path.filePaths.length !== 0) {
                        BrowserWindow.getFocusedWindow().webContents.send("export", path.filePaths[0])
                    }
                })
            }
        },
        {
            label: "Build",
            accelerator: "CmdOrCtrl+B",
            click: () => {
                dialog.showOpenDialog({defaultPath: app.getPath("downloads"), properties: ["openDirectory", "createDirectory"]}).then((path) => {
                    if (path.filePaths.length !== 0) {
                        BrowserWindow.getFocusedWindow().webContents.send("build", path.filePaths[0])
                    }
                })
            }
        }
    ]
}
