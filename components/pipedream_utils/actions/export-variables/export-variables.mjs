import { ConfigurationError } from "@pipedream/platform";
import pipedream_utils from "../../pipedream_utils.app.mjs";

export default {
  key: "pipedream_utils-export-variables",
  name: "Helper Functions - Export Variables",
  description: "Export variables for use in your workflow",
  version: "0.0.1",
  type: "action",
  props: {
    pipedream_utils,
    config: {
      type: "object",
      label: "Configuration",
      description: "Enter key-value pairs that you'd like to reference throughout your workflow.",
    },
  },
  methods: {
    emptyStrToUndefined(value) {
      const trimmed = typeof(value) === "string" && value.trim();
      return trimmed === ""
        ? undefined
        : value;
    },
    parse(value) {
      const valueToParse = this.emptyStrToUndefined(value);
      if (typeof(valueToParse) === "object" || valueToParse === undefined) {
        return valueToParse;
      }
      try {
        return JSON.parse(valueToParse);
      } catch (e) {
        throw new ConfigurationError("Make sure the custom expression contains a valid object");
      }
    },
  },
  run({ $ }) {
    $.export("config", this.parse(this.config));
  },
};
