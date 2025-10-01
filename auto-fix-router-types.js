const { Project } = require("ts-morph");
const fs = require("fs");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "tsconfig.json"
});

const serverDir = path.join(__dirname, "server");

function findTSFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findTSFiles(filePath));
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      results.push(filePath);
    }
  });

  return results;
}

const tsFiles = findTSFiles(serverDir);

tsFiles.forEach((filePath) => {
  const sourceFile = project.getSourceFile(filePath) || project.addSourceFileAtPath(filePath);
  let hasChanges = false;
  let needsRouter = false;
  let needsExpress = false;

  // Annotate relevant variables
  sourceFile.getVariableDeclarations().forEach((v) => {
    const initText = v.getInitializer()?.getText() || "";
    if (v.getName() === "router" && initText.includes("express.Router")) {
      v.setType("Router");
      needsRouter = true;
      hasChanges = true;
    }
    if (v.getName() === "app" && initText.includes("express()")) {
      v.setType("Express");
      needsExpress = true;
      hasChanges = true;
    }
  });

  // Update express import if needed
  if (needsRouter || needsExpress) {
    const imp = sourceFile.getImportDeclaration((i) => i.getModuleSpecifierValue() === "express");
    if (imp) {
      const existing = imp.getNamedImports().map((i) => i.getName());
      if (needsRouter && !existing.includes("Router")) {
        imp.addNamedImport("Router");
      }
      if (needsExpress && !existing.includes("Express")) {
        imp.addNamedImport("Express");
      }
    }
  }

  if (hasChanges) {
    sourceFile.saveSync();
    console.log(`✔ Fixed: ${filePath}`);
  }
});
