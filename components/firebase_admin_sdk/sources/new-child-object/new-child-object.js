const common = require("../common.js");

module.exports = {
  ...common,
  key: "firebase_admin_sdk-new-child-object",
  name: "New Child Object in a Realtime Database",
  description:
    "Emits an event when a new child object is discovered within a specific path",
  version: "0.0.1",
  dedupe: "unique",
  props: {
    ...common.props,
    path: {
      propDefinition: [
        common.props.firebase,
        "path",
      ],
    },
  },
  methods: {
    ...common.methods,
    generateMeta(key, timestamp) {
      return {
        id: key,
        summary: key,
        ts: timestamp,
      };
    },
    async processEvent(event) {
      const ref = this.firebase
        .getApp()
        .database()
        .ref(this.path);
      const snapshot = await ref.get();
      const children = snapshot.val() || {};

      const { timestamp } = event;
      for (const [
        key,
        value,
      ] of Object.entries(children)) {
        const meta = this.generateMeta(key, timestamp);
        const child = {
          key,
          value,
        };
        this.$emit(child, meta);
      }
    },
  },
};
