// Preload: keep the bridge minimal; renderer never touches Node directly.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("panelSim", {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
