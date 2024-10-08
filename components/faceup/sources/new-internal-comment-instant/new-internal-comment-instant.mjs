import faceup from "../../faceup.app.mjs";
import sampleEmit from "./test-event.mjs";

export default {
  key: "faceup-new-internal-comment-instant",
  name: "New Internal Comment (Instant)",
  description: "Emit new event when a new internal comment is created. Must create webhook within the Faceup UI and enter the URL of this source to receive events. [See the documentation](https://support.faceup.com/en/article/webhooks)",
  version: "0.0.1",
  type: "source",
  dedupe: "unique",
  props: {
    faceup,
    http: "$.interface.http",
  },
  methods: {
    generateMeta(body) {
      const { data: { message } } = body;
      return {
        id: message.id,
        summary: `New Internal Comment ID: ${message.id}`,
        ts: Date.parse(message.created_at),
      };
    },
  },
  async run(event) {
    const { body } = event;
    if (body?.event === "InternalCommentCreated") {
      const meta = this.generateMeta(body);
      this.$emit(body, meta);
    }
  },
  sampleEmit,
};
