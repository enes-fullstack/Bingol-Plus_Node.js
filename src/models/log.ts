import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class Log extends Model<InferAttributes<Log>, InferCreationAttributes<Log>> {
    declare id: CreationOptional<number>;
    declare type: string;
    declare message: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

Log.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [["success", "info", "warning", "error", "critical"]]
        }
    },
    message: {
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
    tableName: "logs",
    modelName: "Log"
});

export default Log;
