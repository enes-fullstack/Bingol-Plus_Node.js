import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

import { sequelize } from "../database/connection.js";

class JobApplication extends Model<InferAttributes<JobApplication>, InferCreationAttributes<JobApplication>> {
    declare id: CreationOptional<number>;
    declare jobId: number;
    declare userId: number;
    declare ad: string;
    declare soyad: string;
    declare telefon: string;
    declare email: string;
    declare ilIlce: string;
    declare yas: number;
    declare medeniDurumu: "Bekar" | "Evli";
    declare ogrenimDurumu: "İlköğretim" | "Ortaöğretim" | "Lise" | "Ön Lisans" | "Lisans" | "Eğitim Yok";
    declare surucuBelgesi: "Var" | "Yok";
    declare yabanciDil: "Yok" | "İngilizce" | "Almanca" | "Arapça" | "Diğer";
    declare ekNotlar: string | null;
    declare status: CreationOptional<"inceleniyor" | "kabul_edildi" | "reddedildi">;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

JobApplication.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        jobId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "jobs",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        ad: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        soyad: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        telefon: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ilIlce: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        yas: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        medeniDurumu: {
            type: DataTypes.ENUM("Bekar", "Evli"),
            allowNull: false,
        },
        ogrenimDurumu: {
            type: DataTypes.ENUM("İlköğretim", "Ortaöğretim", "Lise", "Ön Lisans", "Lisans", "Eğitim Yok"),
            allowNull: false,
        },
        surucuBelgesi: {
            type: DataTypes.ENUM("Var", "Yok"),
            allowNull: false,
        },
        yabanciDil: {
            type: DataTypes.ENUM("Yok", "İngilizce", "Almanca", "Arapça", "Diğer"),
            allowNull: false,
        },
        ekNotlar: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("inceleniyor", "kabul_edildi", "reddedildi"),
            allowNull: false,
            defaultValue: "inceleniyor",
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        timestamps: true,
        paranoid: false,
        tableName: "job_applications",
        modelName: "JobApplication",
        indexes: [
            {
                unique: true,
                fields: ["jobId", "userId"],
                name: "unique_job_user_application",
            },
        ],
    }
);

export default JobApplication;
