import common from "../../common.mjs";
import constants from "../../common/constants.mjs";

export default {
  ...common,
  methods: {
    ...common.methods,
    _getLastMessageIDs() {
      return this.db.get(constants.LAST_MESSAGE_IDS) ?? {};
    },
    _setLastMessageIDs(lastMessageIDs) {
      this.db.set(constants.LAST_MESSAGE_IDS, lastMessageIDs);
    },
    _getLastMemberID() {
      return this.db.get(constants.LAST_MEMBER_ID);
    },
    _setLastMemberID(memberID) {
      this.db.set(constants.LAST_MEMBER_ID, memberID);
    },
    _getBotId() {
      return this.db.get("botId");
    },
    _setBotId(botId) {
      this.db.set("botId", botId);
    },
    getBotProfile() {
      return this.discord._makeRequest({
        path: "/users/@me",
      });
    },
  },
};
