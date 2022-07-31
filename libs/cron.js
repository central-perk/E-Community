var config = require("../config"),
  fs = require("fs-extra"),
  cronJob = require("cron").CronJob,
  rootPath = config.PATHS.root,
  mongodbBackuper = require("mongodb-backuper"),
  path = require("path");

// Database scheduled backup
var jobDBBackup = new cronJob(
  config.TIME.midnight,
  function () {
    backupClubDb();
    backupEcdDb();
  },
  null,
  true,
  "Asia/Shanghai"
);

// backup community database
function backupClubDb() {
  var dbBackupPath;
  if (config.isproduction) {
    dbBackupPath = path.join(rootPath, "..", "mnt", "vdc1", "club_db_backup");
  } else {
    dbBackupPath = path.join(rootPath, "..", "club_db_backup", "db");
  }
  // Make sure the database backup folder exists
  fs.ensureDirSync(dbBackupPath);

  mongodbBackuper.init({
    // Backup datastore parent directory
    path: dbBackupPath,
    // Database linkage
    host: config.clubDb.host,
    // Name database
    name: config.clubDb.name,
  });
}

// Backup Easy Leaflet data
function backupEcdDb() {
  var dbBackupPath;
  if (config.isproduction) {
    dbBackupPath = path.join(rootPath, "..", "mnt", "vdc1", "ecd_db_backup");
  } else {
    dbBackupPath = path.join(rootPath, "..", "ecd_db_backup", "db");
  }
  // Make sure the database backup folder exists
  fs.ensureDirSync(dbBackupPath);

  mongodbBackuper.init({
    // Backup datastore parent directory
    path: dbBackupPath,
    // Database linkage
    host: config.ecdDb.host,
    // Name database
    name: config.ecdDb.name,
  });
}

// backupClubDb();
// backupEcdDb();
