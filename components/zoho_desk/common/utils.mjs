import { getFileStreamAndMetadata } from "@pipedream/platform";
import FormData from "form-data";
import retry from "async-retry";
import constants from "./constants.mjs";

async function streamIterator(stream) {
  let resources = [];
  for await (const resource of stream) {
    resources.push(resource);
  }
  return resources;
}

async function buildFormData(formData, data, parentKey) {
  if (data && typeof(data) === "object") {
    for (const key of Object.keys(data)) {
      await buildFormData(formData, data[key], parentKey && `${parentKey}[${key}]` || key);
    }
  } else if (data && constants.FILE_PROP_NAMES.some((prop) => parentKey.includes(prop))) {
    const {
      stream, metadata,
    } = await getFileStreamAndMetadata(data);
    formData.append(parentKey, stream, {
      contentType: metadata.contentType,
      knownLength: metadata.size,
      filename: metadata.name,
    });
  } else if (data) {
    formData.append(parentKey, (data).toString());
  }
}

async function getFormData(data) {
  try {
    const formData = new FormData();
    await buildFormData(formData, data);
    return formData;
  } catch (error) {
    console.log("FormData Error", error);
    throw error;
  }
}

function hasMultipartHeader(headers) {
  return headers
    && headers[constants.CONTENT_TYPE_KEY_HEADER]?.
      includes(constants.MULTIPART_FORM_DATA_VALUE_HEADER);
}

function isRetriable(statusCode) {
  return [
    500,
  ].includes(statusCode);
}

async function withRetries(apiCall) {
  return retry(async (bail) => {
    try {
      return await apiCall();
    } catch (err) {
      const statusCode = err?.response?.status;
      if (!isRetriable(statusCode)) {
        return bail(err);
      }
      console.log(`Retrying with temporary error: ${err.message}`);
      throw err;
    }
  }, {
    retries: 3,
  });
}

export default {
  streamIterator,
  buildFormData,
  getFormData,
  withRetries,
  hasMultipartHeader,
};
