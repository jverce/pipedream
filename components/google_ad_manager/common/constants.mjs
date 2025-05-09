const BASE_URL = "https://admanager.googleapis.com";
const VERSION_PATH = "/v1";

const DATE_RANGE_TYPE = {
  FIXED: "fixed",
  RELATIVE: "relative",
};

const VISIBILITY_OPTIONS = [
  "HIDDEN",
  "DRAFT",
  "SAVED",
];

const REPORT_TYPE_OPTIONS = [
  "REPORT_TYPE_UNSPECIFIED",
  "HISTORICAL",
];

const TIME_PERIOD_COLUMN_OPTIONS = [
  "TIME_PERIOD_COLUMN_UNSPECIFIED",
  "TIME_PERIOD_COLUMN_DATE",
  "TIME_PERIOD_COLUMN_WEEK",
  "TIME_PERIOD_COLUMN_MONTH",
  "TIME_PERIOD_COLUMN_QUARTER",
];

export default {
  BASE_URL,
  VERSION_PATH,
  DATE_RANGE_TYPE,
  VISIBILITY_OPTIONS,
  REPORT_TYPE_OPTIONS,
  TIME_PERIOD_COLUMN_OPTIONS,
};
