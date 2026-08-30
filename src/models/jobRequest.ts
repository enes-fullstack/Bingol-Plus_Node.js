import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class JobRequest extends Model<InferAttributes<JobRequest>, InferCreationAttributes<JobRequest>> {
    declare id: CreationOptional<number>;
    declare title: string;
    declare description: string;
    declare company: string;
    declare location: string;
    declare salary: string | null;
    declare phone: string | null;
    declare type: string | null;
    declare userId: number;
    declare status: CreationOptional<"pending" | "approved" | "rejected">;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
};

JobRequest.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    salary: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending"
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
    tableName: "job_requests",
    modelName: "JobRequest"
});

export default JobRequest;
