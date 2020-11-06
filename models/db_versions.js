module.exports =  function (sequelize, dataTypes){
    return  sequelize.define('db_versions', {
        version: {
            type : dataTypes.INTEGER,
            unique: true,
            allowNull: false
        },
        supplier_name: {
            type: dataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: dataTypes.TEXT,
            defaultValue: 'Has no description'
        }
    }, {
        freezeTableName: true
    });
}
