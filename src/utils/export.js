import JSZip from 'jszip'
import YAML from 'yaml'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportProject(project) {
  const { groupId, projectName, artifactId, version, finder = [] } = project
  const zip = new JSZip()

  const groupPath = groupId.replace(/\./g, '/')
  const mainPath = `src/main/java/${groupPath}`
  const resPath = 'src/main/resources'

  const Blockly = window.Blockly
  if (!Blockly?.Java) throw new Error('Blockly Java generator not loaded')

  const pluginYaml = {
    name: projectName,
    main: `${groupId}.${projectName}`,
    version,
    api_version: '1.20',
    commands: {}
  }

  const mainImports = []
  const onEnableLines = []

  for (const fileData of finder) {
    const ws = new Blockly.Workspace()
    try {
      const raw = fileData.code || '{}'
      const state = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (state && Object.keys(state).length > 0) {
        Blockly.serialization.workspaces.load(state, ws)
      }
    } catch (e) {
      console.warn('workspace load error for', fileData.name, e)
    }

    const javaCode = Blockly.Java.workspaceToCode(
      ws,
      fileData.type,
      `${groupId}.${fileData.type}`,
      fileData.name
    )
      .replace(/MainPluginName/g, projectName)
      .replace(/MainPluginPath/g, groupId)

    zip.file(`${mainPath}/${fileData.type}/${fileData.name}.java`, javaCode)
    mainImports.push(`import ${groupId}.${fileData.type}.${fileData.name};`)

    if (fileData.type === 'event') {
      onEnableLines.push(
        `        getServer().getPluginManager().registerEvents(new ${fileData.name}(), this);`
      )
    } else {
      onEnableLines.push(
        `        getCommand("${fileData.name}").setExecutor(new ${fileData.name}());`
      )
      pluginYaml.commands[fileData.name] = {
        description: 'A plugin command',
        usage: `/${fileData.name}`
      }
    }
  }

  zip.file(`${mainPath}/${projectName}.java`, generateMainClass(groupId, projectName, mainImports, onEnableLines))
  zip.file(`${mainPath}/Database.java`, generateDatabase(groupId))
  zip.file(`${resPath}/plugin.yml`, YAML.stringify(pluginYaml))
  zip.file('build.gradle', generateBuildGradle(groupId, version))
  zip.file('settings.gradle', `rootProject.name = '${artifactId}'`)

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  downloadBlob(blob, `${artifactId}-${version}-src.zip`)
}

export function saveProjectFile(project) {
  const data = JSON.stringify(project, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  downloadBlob(blob, `${project.artifactId || 'project'}.plocky`)
}

export function importProjectFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.plocky,.json'
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0]
        if (!file) return reject(new Error('No file selected'))
        const text = await file.text()
        resolve(JSON.parse(text))
      } catch (err) {
        reject(err)
      }
    }
    input.oncancel = () => reject(new Error('AbortError'))
    input.click()
  })
}

function generateMainClass(groupId, projectName, imports, onEnable) {
  return `package ${groupId};

import org.bukkit.plugin.java.JavaPlugin;
${imports.join('\n')}
import java.io.File;

public class ${projectName} extends JavaPlugin {
    private static ${projectName} instance;
    private static Database db;

    public ${projectName}() {
        instance = this;
        db = new Database(new File(getDataFolder().getAbsolutePath() + "/db.json"));
    }

    public static ${projectName} getInstance() { return instance; }
    public static Database getDB() { return db; }

    @Override
    public void onEnable() {
${onEnable.join('\n')}
    }
}
`
}

function generateDatabase(groupId) {
  return `package ${groupId};

import com.google.gson.Gson;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;

public class Database {
    private final File file;
    private HashMap<String, Object> data = new HashMap<>();

    public Database(File file) {
        this.file = file;
        load();
    }

    public void load() {
        try {
            if (!file.getParentFile().exists()) file.getParentFile().mkdirs();
            if (!file.exists()) {
                try (PrintWriter pw = new PrintWriter(file, "UTF-8")) { pw.println("{}"); }
            }
            try (InputStreamReader r = new InputStreamReader(
                    new FileInputStream(file), StandardCharsets.UTF_8)) {
                data = new Gson().fromJson(r, HashMap.class);
            }
        } catch (Exception e) { e.printStackTrace(); }
    }

    public void save() {
        try (FileWriter fw = new FileWriter(file)) {
            fw.write(new Gson().toJson(data));
        } catch (Exception e) { e.printStackTrace(); }
    }

    public HashMap<String, Object> getData() { return data; }
}
`
}

function generateBuildGradle(groupId, version) {
  return `plugins {
    id 'java'
}

group '${groupId}'
version '${version}'

repositories {
    mavenCentral()
    maven { url 'https://repo.papermc.io/repository/maven-public/' }
}

dependencies {
    compileOnly 'io.papermc.paper:paper-api:1.20.4-R0.1-SNAPSHOT'
    implementation 'com.google.code.gson:gson:2.10.1'
}

java {
    toolchain.languageVersion = JavaLanguageVersion.of(21)
}
`
}
