const express = require("express");
const router = express.Router();

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect("/auth/discord");
    }
}

// Dashboard home
router.get("/", requireAuth, (req, res) => {
    res.render("dashboard/index", {
        user: req.user,
        page: "dashboard",
    });
});

// Server management
router.get("/servers", requireAuth, (req, res) => {
    res.render("dashboard/servers", {
        user: req.user,
        page: "servers",
    });
});

// Server details
router.get("/server/:id", requireAuth, (req, res) => {
    res.render("dashboard/server-details", {
        user: req.user,
        page: "server-details",
        serverId: req.params.id,
    });
});

// Commands management
router.get("/commands", requireAuth, (req, res) => {
    res.render("dashboard/commands", {
        user: req.user,
        page: "commands",
    });
});

// Bot monitoring
router.get("/monitoring", requireAuth, (req, res) => {
    res.render("dashboard/monitoring", {
        user: req.user,
        page: "monitoring",
    });
});

// User management
router.get("/users", requireAuth, (req, res) => {
    res.render("dashboard/users", {
        user: req.user,
        page: "users",
    });
});

// Settings
router.get("/settings", requireAuth, (req, res) => {
    res.render("dashboard/settings", {
        user: req.user,
        page: "settings",
    });
});

module.exports = router;
