const {DataTypes,Model} = require("sequelize");

const sequelize = require("../../connection/connection");
const {USER_ROLE, USER_ROLE_VALUES} = require("../../../lib/roles");
const UserToken = require("./user-token.model");
const RefreshToken = require("./refresh-token.model");


class User extends Model{}

User.init(
    {
        id:{
            type:DataTypes.INTEGER,
            primaryKey:true,
            autoIncrement:true
        },
        name:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        email:{
            type:DataTypes.STRING(100),
            allowNull:false,
            unique:true,
            validate:{
                isEmail:true
            }
        },
        password_hash:{
            type:DataTypes.STRING,
            allowNull:false
        },
        role:{
            type:DataTypes.ENUM(...USER_ROLE_VALUES),
            allowNull:false,
            defaultValue:USER_ROLE.USER
        },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        designation_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_email_verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },      
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        can_edit_profile: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        profile_image_key: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName:"User",
        tableName:"ums_users",
        timestamps:true,
        underscored:true
    }
)

User.hasMany(RefreshToken, {
  foreignKey: "user_id",
  as: "refreshTokens",
});


RefreshToken.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
  onDelete: "CASCADE",
});

User.hasMany(UserToken, {
  foreignKey: "user_id",
  as: "tokens",
});

UserToken.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
  onDelete: "CASCADE",
});


module.exports=User;