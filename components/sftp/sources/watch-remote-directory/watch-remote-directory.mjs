import { createHash } from "crypto";
import app from "../../sftp.app.mjs";
import { DEFAULT_POLLING_SOURCE_TIMER_INTERVAL } from "@pipedream/platform";

export default {
  key: "sftp-watch-remote-directory",
  name: "New Remote Directory Watcher",
  description: "Emit new events when files get created, changed or deleted from a remote directory. [See the docs](https://github.com/theophilusx/ssh2-sftp-client#orgfac43d1)",
  version: "0.1.1",
  type: "source",
  dedupe: "unique",
  props: {
    app,
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: DEFAULT_POLLING_SOURCE_TIMER_INTERVAL,
      },
    },
    db: "$.service.db",
    rootDirectory: {
      label: "Root directory",
      description: "Root directory to be watched. example: `/public`",
      type: "string",
      default: "/",
    },
    maxDepth: {
      label: "Maximum watcher depth",
      description: "Watch all subdirectories within of the root directory, considering the selected maximum depth.",
      type: "integer",
      min: 0,
    },
  },
  methods: {
    setFiles(files) {
      this.db.set("files", files);
    },
    getFiles() {
      return this.db.get("files") || [];
    },
    getChangesWithEvent(currentFiles, previousFiles) {
      const fileChanges = [];
      // deleted file detection;
      for (const prvFile of previousFiles) {
        const file = currentFiles.find((p) => p.path === prvFile.path);
        if (!file) {
          fileChanges.push({
            ...prvFile,
            event: "deleted",
          });
        }
      }
      // created, updated file detection;
      for (const file of currentFiles) {
        const prvFile = previousFiles.find((p) => p.path === file.path);
        if (prvFile) {
          // unchanged files (checking size and last update time)
          if (prvFile.size === file.size && prvFile.modifyTime === file.modifyTime) {
            continue;
          }
          // file has changed
          fileChanges.push({
            ...file,
            event: "updated",
          });
        } else {
          // new file detection
          fileChanges.push({
            ...file,
            event: "created",
          });
        }
      }
      return fileChanges;
    },
    async listDirectories(sftp, parent, currDepth) {
      const files = await sftp.list(parent);
      return files.filter((file) => file.type === "d")
        .map((directory) => ({
          ...directory,
          parent,
          path: `${parent}/${directory.name}`,
          depth: currDepth,
        }));
    },
    async listDirectoriesDeep(sftp, parent, maxDepth, currDepth) {
      if (currDepth > maxDepth) {
        return [];
      }
      const nextDepth = currDepth + 1;
      const rootDirectories = await this.listDirectories(sftp, parent, currDepth);
      const childrenDirectories = [];
      for (const item of rootDirectories) {
        const path = `${parent}/${item.name}`;
        const directories = await this.listDirectoriesDeep(sftp, path, maxDepth, nextDepth);
        childrenDirectories.push(...directories);
      }
      rootDirectories.push(...childrenDirectories);
      return rootDirectories;
    },
    async listAllFilesFromDirectories(sftp, directories) {
      const allFiles = [];
      for (const directory of directories) {
        const listingResult = await sftp.list(directory.path);
        const files = listingResult.filter((file) => file.type !== "d")
          .map((file) => ({
            ...file,
            directory: directory.path,
            path: `${directory.path}/${file.name}`,
            depth: directory.depth || 0,
          }));
        allFiles.push(...files);
      }
      return allFiles;
    },
    validateRootDirectory(rootDirectory) {
      if (!rootDirectory) {
        throw new Error("Must provide root directory");
      }
      if (!rootDirectory.startsWith("/")) {
        throw new Error("The root directory must to be the absolute path and start with a slash, such as: '/public'");
      }
    },
    getEventId(event) {
      return createHash("md5")
        .update(event.path + event.modifyTime)
        .digest("hex");
    },
    emitEvents(events) {
      // sort events by modification time in ascending order
      events.sort((a, b) => a.modifyTime - b.modifyTime);
      for (const fileChangeEvent of events) {
        this.$emit(fileChangeEvent, {
          id: this.getEventId(fileChangeEvent),
          summary: `${fileChangeEvent.event} ${fileChangeEvent.path}`,
          ts: new Date(fileChangeEvent.modifyTime),
        });
      }
    },
  },
  async run() {
    this.validateRootDirectory(this.rootDirectory);

    const sftp = await this.app.connect();

    let directories = [
      {
        path: this.rootDirectory,
      },
    ];
    directories = directories.concat(
      await this.listDirectoriesDeep(sftp, this.rootDirectory, this.maxDepth, 0),
    );

    const currentFiles = await this.listAllFilesFromDirectories(sftp, directories);
    const previousFiles = this.getFiles();
    const filesChangesWithEvent = this.getChangesWithEvent(currentFiles, previousFiles);
    this.emitEvents(filesChangesWithEvent);

    this.setFiles(currentFiles);
    await this.app.disconnect(sftp);
  },
};
