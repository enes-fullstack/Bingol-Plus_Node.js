import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class PostCategory extends Model<InferAttributes<PostCategory>, InferCreationAttributes<PostCategory>> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare slug: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

PostCategory.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
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
    tableName: "post_categories",
    modelName: "PostCategory"
});

export default PostCategory;
