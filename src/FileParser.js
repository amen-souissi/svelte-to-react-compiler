import { parseFragment } from "parse5";
import { readFileSync } from "fs";
import path from "path";

const FileParser = {
  readFile(filePath) {
    const source = readFileSync(filePath, { encoding: "utf8" });
    const fragment = parseFragment(source);
    var filename = path.basename(filePath, ".svelte");

    return this.extract(fragment, filename);
  },

  extract(fragment, filename) {
    const tags = [];
    let code = "";

    fragment.childNodes.forEach((node) => {
      if (node.nodeName === "script") {
        code += node.childNodes[0].value;
      } else {
        tags.push(node);
      }
    });

    return { code, tags, filename };
  },
};

export default FileParser;
