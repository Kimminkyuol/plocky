/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import {app} from "electron"

export default {
    label: "App",
    submenu: [
        {
            label: "Quit",
            accelerator: "CmdOrCtrl+Q",
            click: () => {
                app.quit()
            }
        }
    ]
}
