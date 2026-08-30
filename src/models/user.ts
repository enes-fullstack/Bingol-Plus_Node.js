import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare email: string;
    declare username: string;
    declare password: string;
    declare role: CreationOptional<"user" | "admin">;
    declare banned: CreationOptional<boolean>;
    declare ip: CreationOptional<string>;
    declare userAgent: CreationOptional<string>;
    declare deletedAt: CreationOptional<Date>;
    declare profileImage: CreationOptional<string | null>;
    declare profileImageDate: CreationOptional<string | null>;
    declare profileImageCount: CreationOptional<number>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

User.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            len: [10,50]
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [2,50]
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: "user",
        validate: {
            isIn: [["user", "admin"]]
        }
    },
    banned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "0"
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Unknown"
    },
    profileImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profileImageDate: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    profileImageCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    deletedAt: {
        type: DataTypes.DATE
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
    paranoid: true,
    tableName: "users",
    modelName: "User"
});

export default User;
