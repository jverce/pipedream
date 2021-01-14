const axios = require("axios");
const { v4: uuid } = require("uuid");

module.exports = {
  type: "app",
  app: "datadog",
  methods: {
    _apiKey() {
      return this.$auth.api_key;
    },
    _applicationKey() {
      return this.$auth.application_key;
    },
    _baseUrl() {
      return (
        this.$auth.base_url ||
        "https://api.datadoghq.com/api/v1"
      );
    },
    _webhooksUrl(name) {
      const baseUrl = this._baseUrl();
      const basePath = "/integration/webhooks/configuration/webhooks";
      const path = name ? `${basePath}/${name}` : basePath;
      return `${baseUrl}${path}`;
    },
    _monitorsUrl(id) {
      const baseUrl = this._baseUrl();
      const basePath = "/monitor";
      const path = id ? `${basePath}/${id}` : basePath;
      return `${baseUrl}${path}`;
    },
    _makeRequestConfig() {
      const apiKey = this._apiKey();
      const applicationKey = this._applicationKey();
      const headers = {
        "DD-API-KEY": apiKey,
        "DD-APPLICATION-KEY": applicationKey,
        "User-Agent": "@PipedreamHQ/pipedream v0.1",
      };
      return {
        headers,
      };
    },
    _webhookSecretKeyHeader() {
      return "x-webhook-secretkey";
    },
    isValidSource(event, secretKey) {
      const { headers } = event;
      return headers[this._webhookSecretKeyHeader()] === secretKey;
    },
    async listMonitors(page, pageSize) {
      const apiUrl = this._monitorsUrl();
      const baseRequestConfig = this._makeRequestConfig();
      const params = {
        page,
        page_size: pageSize,
      };
      const requestConfig = {
        ...baseRequestConfig,
        params,
      };
      const { data } = await axios.get(apiUrl, requestConfig);
      return data;
    },
    async createWebhook(
      url,
      payloadFormat = null,
      secretKey = uuid(),
    ) {
      const apiUrl = this._webhooksUrl();
      const requestConfig = this._makeRequestConfig();

      const name = `pd-${uuid()}`;
      const customHeaders = {
        [this._webhookSecretKeyHeader()]: secretKey,
      };
      const requestData = {
        custom_headers: JSON.stringify(customHeaders),
        payload: JSON.stringify(payloadFormat),
        name,
        url,
      };

      await axios.post(apiUrl, requestData, requestConfig);
      return {
        name,
        secretKey,
      };
    },
    async deleteWebhook(webhookName) {
      const apiUrl = this._webhooksUrl(webhookName);
      const requestConfig = this._makeRequestConfig();
      await axios.delete(apiUrl, requestConfig);
    },
  },
};
