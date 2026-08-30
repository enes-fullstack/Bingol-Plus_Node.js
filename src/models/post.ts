import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
    declare id: CreationOptional<number>;
    declare userId: number;
    declare categoryId: number;
    declare title: string;
    declare content: string;
    declare likes: CreationOptional<number>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

Post.init({
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
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    likes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    tableName: "posts",
    modelName: "Post"
});

export default Post;
