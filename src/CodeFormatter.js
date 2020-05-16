import prettier from "prettier";

const CodeFormatter = {
  format(code) {
    return prettier.format(code, { parser: "babel" });
  },
};

export default CodeFormatter;
