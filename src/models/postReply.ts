import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class PostReply extends Model<InferAttributes<PostReply>, InferCreationAttributes<PostReply>> {
    declare id: CreationOptional<number>;
    declare postId: number;
    declare userId: number;
    declare content: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

PostReply.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize,
    timestamps: true,
    paranoid: false,
    tableName: "post_replies",
    modelName: "PostReply"
});

export default PostReply;
