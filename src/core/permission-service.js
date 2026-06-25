module.exports = function createPermissionService() {
  return {
    canRunCustomJavaScript: function () {
      return false;
    },
    canWriteClipboard: function () {
      return true;
    }
  };
};
