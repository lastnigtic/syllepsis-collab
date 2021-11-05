const getUseSpec = (spec) => {
  const { parseDOM, toDOM, editor, props, ...rest } = spec;
  return rest;
};

const getSchemaJSON = (schema) => {
  const json = {
    nodes: {},
    marks: {},
  };

  Object.keys(schema.nodes).forEach((name) => {
    json.nodes[name] = getUseSpec(schema.nodes[name].spec);
  });
  Object.keys(schema.marks).forEach((name) => {
    json.marks[name] = getUseSpec(schema.marks[name].spec);
  });

  return json;
};

export { getSchemaJSON };
