/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import {app, BrowserWindow, dialog} from "electron";

export default {
    label: "File",
    submenu: [
        {
            label: "New Project",
            click: () => {
                BrowserWindow.getFocusedWindow().webContents.send("newProject")
            }
        },
        {
            label: "Save",
            accelerator: "CmdOrCtrl+S",
            click: () => {
                BrowserWindow.getFocusedWindow().webContents.send("save");
            }
        },
        {
            label: "Save AS",
            accelerator: "Shift+CmdOrCtrl+S",
            click: () => {
                dialog.showOpenDialog({defaultPath: app.getPath("downloads"), properties: ["openDirectory", "createDirectory"]}).then((path) => {
                    if (path.filePaths.length !== 0) {
                        BrowserWindow.getFocusedWindow().webContents.send("saveAs", path.filePaths[0]);
                    }
                })
            }
        }
    ]
}
