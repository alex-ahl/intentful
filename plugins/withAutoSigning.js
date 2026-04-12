const { withXcodeProject } = require("@expo/config-plugins");

/**
 * Config plugin that sets CODE_SIGN_STYLE = Automatic and DEVELOPMENT_TEAM
 * on ALL targets (main app + extensions) so Xcode can auto-provision them.
 */
function withAutoSigning(config, { teamId }) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const pbxProject = project.hash.project.objects.PBXProject;
    const pbxNativeTarget =
      project.hash.project.objects.PBXNativeTarget || {};

    // Get the root project object
    const projectId = Object.keys(pbxProject).find(
      (k) => !k.endsWith("_comment"),
    );
    const rootProject = pbxProject[projectId];

    // Ensure TargetAttributes exists
    if (!rootProject.attributes) rootProject.attributes = {};
    if (!rootProject.attributes.TargetAttributes)
      rootProject.attributes.TargetAttributes = {};

    // Iterate all native targets
    for (const [targetId, target] of Object.entries(pbxNativeTarget)) {
      if (targetId.endsWith("_comment") || typeof target === "string")
        continue;

      // Set TargetAttributes for automatic signing
      rootProject.attributes.TargetAttributes[targetId] = {
        ...(rootProject.attributes.TargetAttributes[targetId] || {}),
        ProvisioningStyle: "Automatic",
        DevelopmentTeam: teamId,
      };

      // Set build settings on all configurations
      const configListId = target.buildConfigurationList;
      const configList =
        project.hash.project.objects.XCConfigurationList[configListId];
      if (!configList) continue;

      for (const configRef of configList.buildConfigurations) {
        const configId =
          typeof configRef === "object" ? configRef.value : configRef;
        const buildConfig =
          project.hash.project.objects.XCBuildConfiguration[configId];
        if (!buildConfig) continue;

        buildConfig.buildSettings.CODE_SIGN_STYLE = "Automatic";
        buildConfig.buildSettings.DEVELOPMENT_TEAM = teamId;
      }
    }

    return config;
  });
}

module.exports = withAutoSigning;
