import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class SavedJob extends Model<InferAttributes<SavedJob>, InferCreationAttributes<SavedJob>> {
    declare id: CreationOptional<number>;
    declare userId: number;
    declare jobId: number;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

SavedJob.init({
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
    jobId: {
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
    tableName: "saved_jobs",
    modelName: "SavedJob"
});

export default SavedJob;
