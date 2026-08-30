import User from "../models/user.js";
import Job from "../models/jobs.js";
import SavedJob from "../models/savedJobs.js";
import Post from "../models/post.js";
import PostCategory from "../models/postCategory.js";
import PostLike from "../models/postLike.js";
import PostReply from "../models/postReply.js";
import PasswordReset from "../models/passwordReset.js";
import JobRequest from "../models/jobRequest.js";

export const defineRelationships = (): void => {
    User.hasMany(SavedJob, { foreignKey: "userId" });
    SavedJob.belongsTo(User, { foreignKey: "userId" });

    Job.hasMany(SavedJob, { foreignKey: "jobId" });
    SavedJob.belongsTo(Job, { foreignKey: "jobId" });

    User.hasMany(Post, { foreignKey: "userId" });
    Post.belongsTo(User, { foreignKey: "userId" });

    PostCategory.hasMany(Post, { foreignKey: "categoryId" });
    Post.belongsTo(PostCategory, { foreignKey: "categoryId" });

    User.hasMany(PostLike, { foreignKey: "userId" });
    PostLike.belongsTo(User, { foreignKey: "userId" });

    Post.hasMany(PostLike, { foreignKey: "postId" });
    PostLike.belongsTo(Post, { foreignKey: "postId" });

    User.hasMany(PostReply, { foreignKey: "userId" });
    PostReply.belongsTo(User, { foreignKey: "userId" });

    Post.hasMany(PostReply, { foreignKey: "postId" });
    PostReply.belongsTo(Post, { foreignKey: "postId" });

    User.hasMany(PasswordReset, { foreignKey: "userId" });
    PasswordReset.belongsTo(User, { foreignKey: "userId" });

    User.hasMany(JobRequest, { foreignKey: "userId" });
    JobRequest.belongsTo(User, { foreignKey: "userId" });
};
