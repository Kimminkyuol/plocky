/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import {BrowserWindow} from "electron"

export default {
    label: "Development",
    submenu: [
        {
            label: "Reload",
            accelerator: "CmdOrCtrl+R",
            click: () => {
                BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache()
            }
        },
        {
            label: "Toggle DevTools",
            accelerator: "Alt+CmdOrCtrl+I",
            click: () => {
                BrowserWindow.getFocusedWindow().toggleDevTools()
            }
        }
    ]
}
