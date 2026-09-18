const {DataTypes, Model} = require("sequelize");
const sequelize = require("../../connection/connection");
const User = require("../users/user.model");

class Designation extends Model{}

Designation.init(
    {
        id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        name:{
            type:DataTypes.STRING(100),
            allowNull:false,
            unique:true
        },
        department_id:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
    },
    {
        sequelize,
        modelName:"Designation",
        tableName:"ums_designations",
        timestamps:true,
        underscored:true,
        indexes:[
            {
                unique:true,
                fields:["department_id","name"]
            }
        ]
    }
)


Designation.hasMany(User, {
  foreignKey: "designation_id",
  as: "users",
});

User.belongsTo(Designation, {
  foreignKey: "designation_id",
  as: "designation",
});

module.exports = Designation;