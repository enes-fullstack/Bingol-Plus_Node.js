const errorCode = {
    // Database
    1001: "Veri tabanı hatası",
    1002: "Veri tabanına bağlanılamadı",
    1003: "Veri tabanı sorgu hatası",

    // Authentication
    2001: "Authentication hatası",
    2002: "Invalid credentials",
    2003: "Session error",
    2004: "Session regeneration error",
    2005: "Session destroy error",
    2006: "Session stale cleanup error",
    2007: "Email send error",

    // User
    3001: "User not found",
    3002: "User operation error",
    3003: "User ban operation error",
    3004: "User delete operation error",
    3005: "User profile image upload error",
    3006: "User registration error",
    3007: "User job request error",

    // Forum
    4001: "Forum post error",
    4002: "Forum post not found",
    4003: "Forum reply error",
    4004: "Forum category error",
    4005: "Forum like operation error",
    4006: "Forum post fetch error",
    4007: "Forum search error",
    4008: "Forum reply fetch error",
    4009: "Forum category create error",
    4010: "Forum category delete error",
    4011: "Forum topic delete error",

    // Job
    5001: "Job error",
    5002: "Job not found",
    5003: "Job operation error",
    5004: "Job create error",
    5005: "Job update error",
    5006: "Job delete error",
    5007: "Job save operation error",
    5008: "Job request approve error",
    5009: "Job request reject error",

    // System
    6001: "System error",
    6002: "System operation error",
    6003: "File upload error",
    6004: "System session error",
} as const;

export default errorCode;
