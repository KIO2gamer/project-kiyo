/**
 * YouTube Subscriber Roles Feature
 *
 * This feature allows Discord users to automatically receive roles based on their YouTube subscriber count.
 * It uses Discord OAuth2 to verify YouTube channel connections and assigns roles accordingly.
 *
 * @author Your Name
 * @version 1.0.0
 */

// Export all feature components
module.exports = {
    // Commands
    commands: {
        ytSubRole: require("./commands/ytSubRole"),
        ytSubRoleConfig: require("./commands/ytSubRoleConfig"),
        testYTSetup: require("./commands/testYTSetup"),
    },

    // Database schemas
    database: {
        YTSubRoleConfig: require("./database/ytSubRoleConfig"),
        TempOAuth2Storage: require("./database/tempOAuth2Storage"),
    },

    // Utilities
    utils: {
        OAuth2Handler: require("./utils/oauth2Handler"),
    },

    // Feature metadata
    meta: {
        name: "YouTube Subscriber Roles",
        version: "1.0.0",
        description: "Automatically assign Discord roles based on YouTube subscriber count",
        author: "Your Name",
        dependencies: ["discord.js", "googleapis", "axios", "express", "mongoose"],
        permissions: ["ManageRoles", "SendMessages", "UseSlashCommands"],
    },
};
