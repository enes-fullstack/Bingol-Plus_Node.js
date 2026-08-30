import bcrypt from "bcryptjs";

export async function seedTestData() {
    const [{ default: User }, { default: Job }, { default: Post }, { default: PostCategory }] = await Promise.all([
        import("../../src/models/user.js"),
        import("../../src/models/jobs.js"),
        import("../../src/models/post.js"),
        import("../../src/models/postCategory.js"),
    ]);

    const hashedPassword = await bcrypt.hash("test1234", 10);

    // Normal user
    const normalUser = await User.create({
        email: "test@test.com",
        username: "testuser",
        password: hashedPassword,
        role: "user",
        ip: "127.0.0.1",
        userAgent: "vitest",
    });

    // Admin user
    const adminUser = await User.create({
        email: "admin@test.com",
        username: "adminuser",
        password: hashedPassword,
        role: "admin",
        ip: "127.0.0.1",
        userAgent: "vitest",
    });

    await Job.create({
        title: "Web Geliştirici",
        description: "Test açıklama",
        company: "Test Şirket",
        location: "Bingöl Merkez",
        userId: normalUser.id,
    });
    await Job.create({
        title: "Muhasebe Uzmanı",
        description: "Test açıklama 2",
        company: "Test Şirket 2",
        location: "Bingöl Merkez",
        userId: normalUser.id,
    });
    await Job.create({
        title: "Satış Danışmanı",
        description: "Test açıklama 3",
        company: "Test Şirket 3",
        location: "Bingöl Merkez",
        userId: normalUser.id,
    });

    const category = await PostCategory.findOne({ where: { name: "Bingöl Gündemi" } });

    const post = await Post.create({
        userId: normalUser.id,
        title: "Bingöl'de Kış Hazırlıkları",
        content: "Bu bir test forum içeriğidir.",
        categoryId: category!.id,
    });

    return { user: normalUser, admin: adminUser, post };
}
