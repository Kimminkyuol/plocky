/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import "./stylesheets/setting.css"

import UIKit from "uikit"
import Icons from "uikit/dist/js/uikit-icons.min"

import Store from "electron-store"
import {ipcRenderer} from "electron";
import * as jetpack from "fs-jetpack";
import jsonPack from "jsonpack/main";
import LZString from "lz-string"

const store = new Store()

UIKit.use(Icons)

ipcRenderer.send("resizeWindow", 600, 500)

document.getElementById("create-new-button").addEventListener("click", () => {
    document.getElementById("index-tab").hidden = true
    document.getElementById("create-tab").hidden = false
})

document.getElementById("cancel-button").addEventListener("click", () => {
    document.getElementById("index-tab").hidden = false
    document.getElementById("create-tab").hidden = true
})

document.getElementById("create-form").addEventListener("submit", event => {
    event.preventDefault()

    store.set("groupId", document.getElementById("group-id").value)
    store.set("artifactId", document.getElementById("artifact-id").value)
    store.set("projectName", document.getElementById("project-name").value)
    store.set("version", document.getElementById("version").value)
    store.set("minecraftVersion", document.getElementById("minecraft-version").value)
    store.set("finder", [])

    ipcRenderer.send("loadFile", "app.html")
    ipcRenderer.send("fullscreen", true)
})

document.querySelectorAll("a").forEach(element => {
    element.addEventListener("click", event => {
        event.preventDefault()
        ipcRenderer.send("openLink", element.href)
    })
})

document.querySelectorAll("input").forEach(element => {
    element.addEventListener("keyup", () => {
        element.value = element.value.replace(/\s/g, "")
    })
})

document.getElementById("open-button").addEventListener("click", () => {
    ipcRenderer.send("openFile")
})

ipcRenderer.on("open", (event, path) => {
    jetpack.readAsync(path, "buffer").then((data) => {
        store.store = jsonPack.unpack(LZString.decompressFromUTF16(data.toString("utf16le")))

        ipcRenderer.send("loadFile", "app.html")
        ipcRenderer.send("fullscreen", true)
    })
})