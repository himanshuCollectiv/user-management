const {DataTypes,Model} = require("sequelize");

const sequelize = require("../../connection/connection");
const User = require("../users/user.model");

class Location extends Model{}

Location.init(
    {
        id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        state:{
            type:DataTypes.STRING(100),
            allowNull:false,
        },
        city:{
            type:DataTypes.STRING(100),
            allowNull:false,
        }
    },
    {
        sequelize,
        modelName:"Location",
        tableName:"ums_locations",
        indexes:[
            {
                unique:true,
                fields:["state","city"]
            }
        ]
    }
)

Location.hasMany(User, {
  foreignKey: "location_id",
  as: "users",
});

User.belongsTo(Location, {
  foreignKey: "location_id",
  as: "location",
});


module.exports= Location;