require('dotenv').config({
    path: './config.env'
});
require('colors');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const util = require('util');


const readDirPromise = util.promisify(fs.readdir);
const migrationsDirectory = path.resolve(path.dirname(require.main.filename), process.env.MIGDIRECTORY);
const readFilePromise = util.promisify(fs.readFile);


const connection = new Sequelize(process.env.DBNAME, process.env.DBUSERNAME, process.env.DBPASSWORD, {
    dialect: 'postgres'
});

const dbModel = require('./models/db_versions')(connection, Sequelize.DataTypes);

async function getDbVersion() {
    await connection.sync({logging: console.log});
    return await dbModel.max('version');
}

async function getFilePaths() {
    return await readDirPromise(migrationsDirectory);
}

async function neededFilePaths(dbVersion) {
    const reg = /\d+/g;
    const paths = await getFilePaths();
    return  paths.filter(function (path) {
        const regexp = /(\.\d+)/g;
        const matched = path.match(regexp);
        let pathVersion = matched && matched[matched.length - 1];
        if (pathVersion) {
            pathVersion =Number(pathVersion.replace(/^\D+/g, ''));
        }
        return pathVersion > dbVersion
    }).sort(function (a, b) {
        let aNotChecked = a;
        let bNotChecked = b;
        const aChecked = aNotChecked.match(reg).map(Number);
        const bChecked = bNotChecked.match(reg).map(Number);
        return  aChecked[aChecked.length - 1] < bChecked[bChecked.length - 1] ? -1 : 1;
    })
}

async function migrate(){
    let currentDbVersion = await getDbVersion();
    if (!currentDbVersion){
        currentDbVersion = 1;
    }
    const filesToBeMigrated = await neededFilePaths(currentDbVersion);
    const len = filesToBeMigrated.length;
    if (len){
        try{
            for (const item of filesToBeMigrated){
                console.log(item.toString())
                const p = path.resolve(migrationsDirectory, item);
                const plainTextDb = await readFilePromise(p);
                await connection.query(plainTextDb.toString());
                const versionNumber = parseInt(item.replace(/^\D+/g, ''))
                await dbModel.create({
                    version: versionNumber,
                    supplier_name: 'Vardges'
                })
            }
        }catch (e){
            console.log('Error occured'.red, e );
            process.exit(1);
        }

    }
}


migrate().then(console.log).catch(console.log);




















