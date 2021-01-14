const datadog = require("../../datadog.app");
const payloadFormat = require("../payload-format");

module.exports = {
  key: "datadog-new-event",
  name: "New Event (Instant)",
  description: "Emits an event when a new Datadog event occurs",
  dedupe: "unique",
  version: "0.0.1",
  props: {
    datadog,
    db: "$.service.db",
    http: {
      type: "$.interface.http",
      customResponse: true,
    },
    monitors: {
      type: "string[]",
      label: "Monitors",
      description: "The monitors to observe for notifications",
      optional: true,
      async options(context) {
        const { page } = context;
        const pageSize = 1;
        const monitors = await this.datadog.listMonitors(page, pageSize);
        const options = monitors.map(monitor => ({
          label: monitor.name,
          value: monitor.id,
        }));

        return {
          options,
        };
      },
    },
  },
  hooks: {
    async activate() {
      const {
        name: webhookName,
        secretKey: webhookSecretKey,
      } = await this.datadog.createWebhook(
        this.http.endpoint,
        payloadFormat,
      );

      console.log(`Created webhook "${webhookName}"`);

      this.db.set("webhookName", webhookName);
      this.db.set("webhookSecretKey", webhookSecretKey);
    },
    async deactivate() {
      const webhookName = this.db.get("webhookName");
      await this.datadog.deleteWebhook(webhookName);
    },
  },
  methods: {
    generateMeta(data) {
      const {
        id,
        eventType,
        date: ts,
      } = data;
      const summary = `New event: ${eventType}`;
      return {
        id,
        summary,
        ts,
      };
    },
  },
  async run(event) {
    const webhookSecretKey = this.db.get("webhookSecretKey");
    if (!this.datadog.isValidSource(event, webhookSecretKey)) {
      console.log(`Skipping event from unrecognized source`);
      this.http.respond({
        status: 404,
      });
      return;
    }

    // Acknowledge the event back to Datadog.
    this.http.respond({
      status: 200,
    });

    const { body } = event;
    const meta = this.generateMeta(body);
    this.$emit(body, meta);
  },
};
