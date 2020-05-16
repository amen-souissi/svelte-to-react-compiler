import { print } from "code-red";
import { Parser } from "acorn";
import jsx from "acorn-jsx";
import jsxGenerate from "astring-jsx";
import { walk } from "estree-walker";

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

const nodeJSX = (node, children, states) => {
  switch (node.type) {
    case "binding": {
      const state = states.find((state) => state.prop === node.name);
      return `{${state ? state.name : node.name}}`;
    }
    case "element": {
      const listeners = node.listeners.map((listener) => eventListenerToString(listener)).join(" ");
      const attrs = attrsToString(node.attrs);
      return `<${node.name} ${attrs} ${listeners}>${children.join("")}</${node.name}>`;
    }
    case "text":
      return `${node.value.replace(/\n/g, "")}`;
  }
};

const nodesToJSX = (nodes, states) => {
  return nodes.map((node) => {
    const children = nodesToJSX(node.children, states);
    return nodeJSX(node, children, states);
  });
};

const getFuncCall = (funcName, args) => {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: { type: "Identifier", start: 76, end: 81, name: funcName },
      arguments: args,
    },
  };
};

const propToUseState = (state) => {
  const elements = [
    { type: "Identifier", name: state.name },
    { type: "Identifier", name: state.setter },
  ];
  return {
    type: "VariableDeclaration",
    declarations: [
      {
        type: "VariableDeclarator",
        id: {
          type: "ArrayPattern",
          elements: elements,
        },
        init: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "React.useState" },
          arguments: [{ type: "Identifier", name: state.prop }],
        },
      },
    ],
    kind: "const",
  };
};

const stateToUseEffect = (state) => {
  return {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: { type: "Identifier", name: "React" },
      property: { type: "Identifier", name: "useEffect" },
    },
    arguments: [
      {
        type: "ArrowFunctionExpression",
        params: [],
        body: {
          type: "BlockStatement",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: {
                  type: "Identifier",
                  name: state.setter,
                },
                arguments: [{ type: "Identifier", name: state.prop }],
              },
            },
          ],
        },
      },
      {
        type: "ArrayExpression",
        elements: [{ type: "Identifier", name: state.prop }],
      },
    ],
  };
};

const ComponentGenerator = {
  generate(props, nodes, listeners, rest, fileName) {
    const root = nodesToTree(nodes, listeners);
    const states = [];
    walk(rest, {
      enter: function (node) {
        if (
          node.type === "ExpressionStatement" &&
          node.expression.type === "AssignmentExpression" &&
          props.includes(node.expression.left.name)
        ) {
          const { name } = node.expression.left;
          const state = `${name}State`;
          const funcName = `set${state.charAt(0).toUpperCase() + state.slice(1)}`;
          states.push({ name: state, prop: name, setter: funcName });
          this.replace(getFuncCall(funcName, [node.expression.right]));
        }
      },
    });
    const useEffects = states.map((state) => stateToUseEffect(state));
    rest.unshift(...useEffects);
    const useStates = states.map((state) => propToUseState(state));
    rest.unshift(...useStates);
    const jsCode = print(rest).code;
    const componentName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    const componentProps = props.length ? `{${props.join(",")}}` : "";
    const componentJSX = nodesToJSX([root], states);

    const component = `
    import * as React from "react"

    export default function ${componentName}(${componentProps}) {
      
      ${jsCode}
      
      return ${componentJSX}
    }`;

    return jsxGenerate(JSXParser.parse(component, { sourceType: "module" }));
  },
};

export default ComponentGenerator;
