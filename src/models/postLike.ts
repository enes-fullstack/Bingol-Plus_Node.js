import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class PostLike extends Model<InferAttributes<PostLike>, InferCreationAttributes<PostLike>> {
    declare id: CreationOptional<number>;
    declare userId: number;
    declare postId: number;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

PostLike.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    postId: {
        type: DataTypes.INTEGER,
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
    tableName: "post_likes",
    modelName: "PostLike"
});

export default PostLike;
