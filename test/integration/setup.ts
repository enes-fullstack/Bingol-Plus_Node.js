import dotenv from "dotenv";

dotenv.config({ path: ".env.test", override: true });

export async function setupTestDatabase() {
    const [{ Sequelize }, { sequelize, connection }, { defineRelationships }, { sessionStore }, { default: config }] =
        await Promise.all([
            import("sequelize"),
            import("../../src/database/connection.js"),
            import("../../src/database/relationships.js"),
            import("../../src/config/session.js"),
            import("../../src/config/config.js"),
        ]);

    const tempSeq = new Sequelize("", config.database.username, config.database.password, {
        host: config.database.host,
        dialect: config.database.dialect as any,
        logging: false,
    });
    await tempSeq.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.database.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await tempSeq.close();
    await connection();

    // Load models so they register on sequelize before sync
    await Promise.all([
        import("../../src/models/user.js"),
        import("../../src/models/jobs.js"),
        import("../../src/models/post.js"),
        import("../../src/models/postCategory.js"),
        import("../../src/models/savedJobs.js"),
        import("../../src/models/postLike.js"),
        import("../../src/models/postReply.js"),
        import("../../src/models/passwordReset.js"),
        import("../../src/models/jobRequest.js"),
        import("../../src/models/log.js"),
    ]);

    defineRelationships();

    // sync({ force: true }) creates tables matching model definitions.
    // Model .init() schemas match migration definitions 1:1.
    // FK constraints are handled by Sequelize associations (relationships.ts)
    // rather than database-level constraints, so sync() is sufficient.
    // Running .cjs migration files via require() in vitest's ESM worker
    // proved unreliable, and the net result (table structure) is identical.
    // If strict migration-based setup is needed later, umzug can be added.
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    // Seed default categories
    const { default: PostCategory } = await import("../../src/models/postCategory.js");
    const CATEGORIES = [
        { name: "Genel", slug: "genel" },
        { name: "Soru & Cevap", slug: "soru-ve-cevap" },
        { name: "Üniversite", slug: "universite" },
        { name: "İş ve Kariyer", slug: "is-ve-kariyer" },
        { name: "Bingöl Gündemi", slug: "bingol-gundemi" },
        { name: "Alım & Satım", slug: "alim-ve-satim" },
    ];
    await PostCategory.bulkCreate(CATEGORIES);
    await sessionStore.sync();
}

export async function teardownTestDatabase() {
    const { sequelize } = await import("../../src/database/connection.js");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.drop();
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    await sequelize.close();
}
