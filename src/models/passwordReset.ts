import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class PasswordReset extends Model<InferAttributes<PasswordReset>, InferCreationAttributes<PasswordReset>> {
    declare id: CreationOptional<number>;
    declare userId: number;
    declare token: string;
    declare expiresAt: Date;
    declare usedAt: CreationOptional<Date | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

PasswordReset.init({
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
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    usedAt: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: "password_resets",
    modelName: "PasswordReset"
});

export default PasswordReset;
