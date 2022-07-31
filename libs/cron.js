var config = require('../config'),
	fs = require('fs-extra'),
	cronJob = require('cron').CronJob,
	rootPath = config.PATHS.root,
	mongodbBackuper = require('mongodb-backuper'),
	path = require('path');

// 数据库定时备份
var jobDBBackup = new cronJob(config.TIME.midnight, function() {
	backupClubDb();
	backupEcdDb();
}, null, true, 'Asia/Shanghai');

//备份社区数据库
function backupClubDb() {
	var dbBackupPath;
	if (config.isproduction) {
		dbBackupPath = path.join(rootPath, '..', 'mnt', 'vdc1', 'club_db_backup');
	} else {
		dbBackupPath = path.join(rootPath, '..', 'club_db_backup', 'db');
	}
	// 确保数据库备份文件夹存在
	fs.ensureDirSync(dbBackupPath);

	mongodbBackuper.init({
		// 备份数据存储父级目录
		path: dbBackupPath,
		// 数据库连接
		host: config.clubDb.host,
		// 数据库名称
		name: config.clubDb.name
	});
}

//备份易传单数据
function backupEcdDb() {
	var dbBackupPath;
	if (config.isproduction) {
		dbBackupPath = path.join(rootPath, '..', 'mnt', 'vdc1', 'ecd_db_backup');
	} else {
		dbBackupPath = path.join(rootPath, '..', 'ecd_db_backup', 'db');
	}
	// 确保数据库备份文件夹存在
	fs.ensureDirSync(dbBackupPath);

	mongodbBackuper.init({
		// 备份数据存储父级目录
		path: dbBackupPath,
		// 数据库连接
		host: config.ecdDb.host,
		// 数据库名称
		name: config.ecdDb.name
	});
}

// backupClubDb();
// backupEcdDb();