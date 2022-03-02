/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import DarkTheme from "@blockly/theme-dark"
import toolbox from "../xmls/toolbox.xml"
import env from "env";
import path from "path";

export const config = () => {
    return {
        grid: {
            spacing: 25,
            length: 3,
            colour: "#ccc",
            snap: true
        },
        readOnly: false,
        move: {
            scrollbars: true,
            drag: true,
            wheel: false,
        },
        toolbox: toolbox,
        theme: DarkTheme,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 4,
            minScale: 0.25,
            scaleSpeed: 1.1
        },
    }
}

export const resPath = () => {
    if (env.name !== "production") {
        return path.join(path.dirname(__dirname), "extraResources")
    } else {
        return path.join(process.resourcesPath, "extraResources")
    }
}