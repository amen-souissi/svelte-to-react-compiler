import { print } from "code-red";
import { Parser } from "acorn";
import jsx from "acorn-jsx";
import jsxGenerate from "astring-jsx";

const JSXParser = Parser.extend(jsx());

const reactFragmentElement = { index: -1, type: "element", name: "React.Fragment", listeners: [] };

const nodeToTree = (nodes, nodeIndex, listeners) => {
  const nodeListeners = listeners.filter((listner) => listner.index === nodeIndex);
  const currentNode = nodes.find((node) => node.index === nodeIndex);
  const children = nodes
    .filter((node) => node.parent === nodeIndex)
    .map((node) => nodeToTree(nodes, node.index, listeners));
  return Object.assign(currentNode, { children, listeners: nodeListeners });
};

const nodesToTrees = (nodes, listeners) => {
  return nodes.filter((node) => node.parent === null).map((node) => nodeToTree(nodes, node.index, listeners));
};

const nodesToTree = (nodes, listeners) => {
  const roots = nodesToTrees(nodes, listeners);
  let root = null;
  if (roots.length > 1) {
    root = Object.assign(reactFragmentElement, { children: roots });
  } else {
    root = roots[0];
  }
  return root;
};

const attrsToString = (attrs = {}) => {
  return Object.entries(attrs).map(([name, value]) => `${attrNameToReactAttrName(name)}="${value}"`);
};

const attrNameToReactAttrName = (name) => {
  switch (name) {
    case "class":
      return "className";
    default:
      return name;
  }
};
const eventListenerToString = (listner) => {
  switch (listner.event) {
    case "click":
      return `onClick={${listner.handler}}`;
  }
};

const nodeJSX = (node, children) => {
  switch (node.type) {
    case "binding":
      return `{${node.name}}`;
    case "element": {
      const listeners = node.listeners.map((listener) => eventListenerToString(listener)).join(" ");
      const attrs = attrsToString(node.attrs);
      return `<${node.name} ${attrs} ${listeners}>${children.join("")}</${node.name}>`;
    }
    case "text":
      return `${node.value.replace(/\n/g, "")}`;
  }
};

const nodesToJSX = (nodes) => {
  return nodes.map((node) => {
    const children = nodesToJSX(node.children);
    return nodeJSX(node, children);
  });
};

const ComponentGenerator = {
  generate(props, nodes, listeners, rest, fileName) {
    const root = nodesToTree(nodes, listeners);
    const jsCode = print(rest).code;
    const componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    const componentProps = props.join(",");
    const componentJSX = nodesToJSX([root]);

    const component = `
    import * as React from "react"

    export default function ${componentName}({${componentProps}}) {
      
      ${jsCode}
      
      return ${componentJSX}
    }`;

    return jsxGenerate(JSXParser.parse(component, { sourceType: "module" }));
  },
};

export default ComponentGenerator;
