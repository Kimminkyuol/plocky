/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

import "./stylesheets/app.css"

import UIKit from "uikit"
import Icons from "uikit/dist/js/uikit-icons.min"
import * as Blockly from "./plocky/blockly_compressed"
import "./plocky/blocks_compressed"
import "./plocky/msg/messages"
import "./plocky/java_compressed"

import {config, resPath} from "./plocky/plocky"

import toolbox from "./xmls/toolbox.xml"
import toolbox_command from "./xmls/toolbox_command.xml"

import {ipcRenderer} from "electron"
import prompt from "native-prompt"
import path from "path"
import * as jetpack from "fs-jetpack"
import {exec} from "child-process-promise"
import Store from "electron-store"
import jsonPack from "jsonpack"
import LZString from "lz-string"
import hljs from "highlight.js"
import YAML from "yaml"

const store = new Store()

let workspace
let current

UIKit.use(Icons)

function initPlayground() {
    const workspace = Blockly.inject(document.getElementById("workspace"), config())

    workspace.addChangeListener(Blockly.Events.disableOrphans)

    Blockly.dialog.prompt = function (message, defaultValue, callback) {
        prompt("Plockly", message, {defaultText: defaultValue}).then(input => {
            callback(input)
        })
    }

    const newListener = (event) => {
        prompt("Plocky", "New File name: ").then(input => {
            if (input) {
                const finder = store.get("finder")
                for (let i in finder) {
                    if (finder[i].name === input) {
                        alert("The name already exists")
                        return
                    }
                }

                finder.push({name: input, type: event.target.dataset.type, code: "{}"})
                store.set("finder", finder)

                UIKit.dropdown(document.getElementById("dropdown-file")).hide()
                loadFinder()
            }
        })
    }

    document.getElementById("new-event").addEventListener("click", newListener)
    document.getElementById("new-command").addEventListener("click", newListener)

    return workspace
}

function initCodeViewer() {
    let code
    const generate_code = () => {
        try {
            if (current) {
                const finder = store.get("finder")[current]
                let remark = ""
                if (current) {
                    remark = "// " + "[" + finder.type + "] " + finder.name + "\n\n"
                }
                const newCode = remark + Blockly.Java.workspaceToCode(workspace, finder.type, store.get("groupId") + "." + finder.type, finder.name)
                    .replace(/MainPluginName/g, store.get("projectName"))
                    .replace(/MainPluginPath/g, store.get("groupId"))
                if (code !== newCode) {
                    code = newCode
                    store.set("finder." + current + ".code", Blockly.serialization.workspaces.save(workspace))
                    document.getElementById("code").innerHTML = hljs.highlight(newCode, {language: "java"}).value
                }
            }
        } catch (error) {
            Blockly.mainWorkspace.undo(false)
            alert(error)
        }
    }

    generate_code()
    workspace.addChangeListener(generate_code)
}

function initIpc() {
    const writeFiles = () => {
        const groupId = store.get("groupId")
        const projectName = store.get("projectName")
        const artifactId = store.get("artifactId")
        const main = groupId + "." + projectName
        const version = store.get("version")

        const pluginYaml = {
            name: projectName,
            main: main,
            version: version,
            commands: {}
        }

        const build = "plugins {\n" +
            "    id 'java'\n" +
            "}\n" +
            "\n" +
            "group '" + groupId + "'\n" +
            "version '" + version + "'\n" +
            "\n" +
            "repositories {\n" +
            "    mavenCentral()\n" +
            "    maven {\n" +
            "        url 'https://papermc.io/repo/repository/maven-public/'\n" +
            "    }\n" +
            "}\n" +
            "\n" +
            "dependencies {\n" +
            "    implementation 'com.destroystokyo.paper:paper-api:1.12.2-R0.1-20190714.184133-413'\n" +
            "    implementation 'com.google.code.gson:gson:2.9.0'\n" +
            "}"

        const settings = "rootProject.name = '" + artifactId + "'"

        const database = "package " + groupId + ";\n" +
            "\n" +
            "import com.google.gson.Gson;\n" +
            "\n" +
            "import java.io.*;\n" +
            "import java.nio.charset.StandardCharsets;\n" +
            "import java.util.HashMap;\n" +
            "\n" +
            "public class Database {\n" +
            "    private final File file;\n" +
            "    private HashMap<String, Object> data = new HashMap<>();\n" +
            "\n" +
            "    public Database(File file) {\n" +
            "        this.file = file;\n" +
            "        load();\n" +
            "    }\n" +
            "\n" +
            "    public void load() {\n" +
            "        try {\n" +
            "            if (!file.getParentFile().exists()) {\n" +
            "                file.getParentFile().mkdirs();\n" +
            "            }\n" +
            "            if (!file.exists()) {\n" +
            "                PrintWriter pw = new PrintWriter(file, \"UTF-8\");\n" +
            "                pw.println(\"{\");\n" +
            "                pw.println(\"}\");\n" +
            "                pw.flush();\n" +
            "                pw.close();\n" +
            "            }\n" +
            "            data = new Gson().fromJson(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8), HashMap.class);\n" +
            "        } catch (Exception e) {\n" +
            "            e.printStackTrace();\n" +
            "        }\n" +
            "    }\n" +
            "\n" +
            "    public void save() {\n" +
            "        try {\n" +
            "            FileWriter fileWriter = new FileWriter(file);\n" +
            "            fileWriter.write(new Gson().toJson(data));\n" +
            "            fileWriter.flush();\n" +
            "            fileWriter.close();\n" +
            "        } catch (Exception e) {\n" +
            "            e.printStackTrace();\n" +
            "        }\n" +
            "    }\n" +
            "\n" +
            "    public HashMap<String, Object> getData() {\n" +
            "        return data;\n" +
            "    }\n" +
            "}\n"

        let mainFile =
            "import org.bukkit.plugin.java.JavaPlugin;\n" +
            "import " + groupId + ".Database;\n" +
            "\n" +
            "import java.io.File;\n" +
            "\n" +
            "public class " + projectName + " extends JavaPlugin {\n" +
            "    private static " + projectName + " instance;\n" +
            "    private static Database db;" +
            "\n" +
            "    public " + projectName + "() {\n" +
            "        instance = this;\n" +
            "        db = new Database(new File(getDataFolder().getAbsolutePath() + \"/db.json\"));\n" +
            "    }\n" +
            "\n" +
            "    public static " + projectName + " getInstance() {\n" +
            "        return instance;\n" +
            "    }\n" +
            "\n" +
            "    public static Database getDB() {\n" +
            "        return db;\n" +
            "    }\n" +
            "\n" +
            "    @Override\n" +
            "    public void onEnable() {"

        const buildPath = path.join(resPath(), "build")

        const mainPath = path.join(buildPath, "src", "main", "java", groupId.replace(/\./g, "/"))

        const resourcesPath = path.join(buildPath, "src", "main", "resources")

        return jetpack.writeAsync(path.join(buildPath, "build.gradle"), Buffer.from(build, "utf8"))
            .then(() => {
                return jetpack.writeAsync(path.join(buildPath, "settings.gradle"), Buffer.from(settings, "utf8"))
            })
            .then(() => {
                return jetpack.writeAsync(path.join(mainPath, "Database.java"), Buffer.from(database, "utf8"))
            })
            .then(() => {
                const finder = store.get("finder")
                for (let i in finder) {
                    const eventWorkspace = new Blockly.Workspace()
                    Blockly.serialization.workspaces.load(finder[i].code, eventWorkspace)
                    const code = Blockly.Java.workspaceToCode(eventWorkspace, finder[i].type, store.get("groupId") + "." + finder[i].type, finder[i].name)
                        .replace(/MainPluginName/g, projectName)
                        .replace(/MainPluginPath/g, groupId)

                    jetpack.write(path.join(mainPath, finder[i].type, finder[i].name + ".java"), Buffer.from(code, "utf8"))

                    mainFile = "import " + groupId + "." + finder[i].type + "." + finder[i].name + ';\n' + mainFile
                    if (finder[i].type === "event") {
                        mainFile += "        getServer().getPluginManager().registerEvents(new " + finder[i].name + "(), this);\n"
                    } else {
                        mainFile += "        getCommand(\"" + finder[i].name + "\").setExecutor(new " + finder[i].name + "());\n"
                        pluginYaml.commands[finder[i].name] = {description: "description", usage: "/" + finder[i].name}
                    }
                }
            })
            .then(() => {
                return jetpack.writeAsync(path.join(resourcesPath, "plugin.yml"), Buffer.from(YAML.stringify(pluginYaml), "utf8"))
            })
            .then(() => {
                mainFile = "package " + groupId + ";\n" +
                    "\n" + mainFile
                mainFile += "    }\n" +
                    "}"

                return jetpack.writeAsync(path.join(mainPath, projectName + ".java"), Buffer.from(mainFile, "utf8"))
            })
    }

    const deleteFiles = () => {
        const buildPath = path.join(resPath(), "build")

        return jetpack.removeAsync(path.join(buildPath, "src"))
            .then(() => {
                return jetpack.removeAsync(path.join(buildPath, "build"))
            })
            .then(() => {
                return jetpack.removeAsync(path.join(buildPath, "build.gradle"))
            })
            .then(() => {
                return jetpack.removeAsync(path.join(buildPath, "settings.gradle"))
            })
    }

    ipcRenderer.on("export", (event, filePath) => {
        writeFiles()
            .then(() => {
                return jetpack.copyAsync(path.join(resPath(), "build"), filePath, {overwrite: true})
            })
            .then(() => {
                alert("Saved successfully")
                return deleteFiles()
            })
    })

    ipcRenderer.on("build", (event, filePath) => {
        const artifactId = store.get("artifactId")
        const version = store.get("version")

        const buildPath = path.join(resPath(), "build")

        const command = process.platform === "win32" ? "./gradlew.bat build" : "./gradlew build"

        writeFiles()
            .then(() => {
                return exec(command, {cwd: buildPath})
            })
            .then(() => {
                alert("Build successfully")
                return jetpack.copyAsync(path.join(buildPath, "build", "libs", artifactId + "-" + version + ".jar"), path.join(filePath, artifactId + "-" + version + ".jar"))
            })
            .then(() => {
                return deleteFiles()
            })
    })

    ipcRenderer.on("save", () => {
        const compress = LZString.compressToUTF16(jsonPack.pack(JSON.stringify(store.store)))
        if (store.has("filePath")) {
            jetpack.write(store.get("filePath"), Buffer.from(compress, "utf16le"))
            alert("Saved successful")
        } else {
            ipcRenderer.send("saveFile", compress, ".plocky")
        }
    })

    ipcRenderer.on("succeed", (event, message) => {
        alert(message)
    })

    ipcRenderer.on("newProject", () => {
        store.clear()
        ipcRenderer.send("fullscreen", false)
        ipcRenderer.send("loadFile", "setting.html")
    })
}

function loadFinder() {
    const finder = document.getElementById("finder")
    while (finder.hasChildNodes()) {
        finder.removeChild(finder.firstChild)
    }

    const header = document.createElement("li")
    header.className = "uk-nav-header"
    header.innerText = "FINDER"
    finder.appendChild(header)

    for (let i in store.get("finder")) {
        const fileData = store.get("finder")[i]
        const file = document.createElement("li")
        const fileLink = document.createElement("a")
        fileLink.href = "#"
        file.appendChild(fileLink)
        const fileIcon = document.createElement("span")
        fileIcon.setAttribute("uk-icon", "icon: code; ratio: 0.7;")
        fileLink.appendChild(fileIcon)
        const fileName = document.createElement("span")
        fileName.innerText = "[" + fileData.type + "] " + fileData.name
        fileLink.appendChild(fileName)
        finder.appendChild(file)

        const dropdown = document.createElement("button")
        dropdown.setAttribute("uk-dropdown", "mode: custom")
        dropdown.className = "uk-button uk-button-danger"
        dropdown.innerText = "DELETE"
        finder.appendChild(dropdown)

        file.addEventListener("dblclick", (event) => {
            event.preventDefault()
            document.getElementById("workspace").classList.remove("uk-invisible")
            document.getElementById("code").classList.remove("uk-invisible")
            current = i
            Blockly.mainWorkspace.clear()
            if (store.get("finder")[i].type === "event") workspace.updateToolbox(toolbox)
            else workspace.updateToolbox(toolbox_command)
            Blockly.serialization.workspaces.load(store.get("finder")[i].code, workspace)
        })

        file.addEventListener("contextmenu", (event) => {
            event.preventDefault()
            UIKit.dropdown(dropdown).show()
        })

        dropdown.addEventListener("click", () => {
            const finder = store.get("finder")
            if (confirm("Are you sure you want to delete? (" + finder[i].name + ")")) {
                finder.splice(i, 1)
                store.set("finder", finder)

                UIKit.dropdown(dropdown).hide()
                loadFinder()
            }
        })
    }
}

window.addEventListener("DOMContentLoaded", () => {
    workspace = initPlayground()
    initCodeViewer()
    initIpc()

    loadFinder()
})
