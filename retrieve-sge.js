#!/usr/bin/env node

const commander = require('commander'),
    colors = require('colors'),
    validate = require('./requests/validate'),
    sqlite3 = require('sqlite3').verbose(),
    Json = require('./utils/json'),
    DBValues = Json.load(__dirname, "./db/databases.json"),
    os = require('os'),
    threads = require('threads'),
    pjson = require('./package.json'),
    config = threads.config,
    Pool = threads.Pool,
    MAX_VAL = 999999;

config.set({
    basepath: {
        node: __dirname + '/requests'
    }
});

commander
    .version(pjson.version)
    .option('-c, --cores <cores>', 'Ammount of cores', /^[0-9]{2,}|[1-9]$/)
    .description(colors.blue('Password retriever system'));


commander
    .command('create')
    .alias('c')
    .description('Creates a database where we store Control Numbers and Passwords')
    .action(() => {
        console.log(colors.blue('DATABASE CREATOR'));
        let db = new sqlite3.Database(`${__dirname}/db/${DBValues.DATABASES.SGE.NAME}`);
        const columns = DBValues.DATABASES.SGE.TABLES.CONTROL_NUMBERS.COLUMNS;
        const sql = `CREATE TABLE ${DBValues.DATABASES.SGE.TABLES.CONTROL_NUMBERS.NAME}(
                ${columns.ID.NAME} ${columns.ID.TYPE}, 
                ${columns.CONTROL_NUMBER.NAME} ${columns.CONTROL_NUMBER.TYPE}, 
                ${columns.PASSWORD.NAME} ${columns.PASSWORD.TYPE}, 
                ${columns.VALID.NAME} ${columns.VALID.TYPE}
            )`;
        db.run(sql, (err) => {
            if (err) {
                if (err.message.includes('exists')) {
                    console.log('Info: %s', colors.yellow("The database already exists"));

                } else {
                    console.log('Error: %s', colors.red("Couldn't create the database"));
                }
            } else {
                console.log('Result: %s', colors.green('Database created'));
            }
        });
        db.close();
    });

commander
    .command('validate <controlNumber>')
    .alias('v')
    .description('Validate existence of Control Number')
    .action(controlNumber => {
        console.log(colors.blue('CONTROL NUMBER VALIDATION'));
        let db = new sqlite3.Database(`${__dirname}/db/${DBValues.DATABASES.SGE.NAME}`, sqlite3.OPEN_READWRITE, async (err) => {
            if (err) {
                console.log('Error: %s', colors.red("Couldn't open the database"));
                console.log('Solution: %s', colors.yellow("Create database with createDatabase command"));
            } else {
                const TBInfo = DBValues.DATABASES.SGE.TABLES.CONTROL_NUMBERS;
                const SQLSearch = `SELECT 
                        ${TBInfo.COLUMNS.ID.NAME}, 
                        ${TBInfo.COLUMNS.VALID.NAME}
                    FROM ${TBInfo.NAME}
                    WHERE ${TBInfo.COLUMNS.CONTROL_NUMBER.NAME} = ?`;
                db.get(SQLSearch, controlNumber, async (err, res) => {
                    if (err) {
                        console.log('Error: %s', colors.red("Couldn't retrieve the control numbers"));
                        db.close(dbClosed);
                    } else if (res) {
                        console.log(colors.yellow(' Control Number in Database'));
                        if (res.valid) {
                            console.log("Result: %s", colors.green("Valid Control Number"));
                        } else {
                            console.log("Error: %s", colors.red("Invalid Control Number"));
                        }
                        db.close(dbClosed);
                    } else {
                        try {
                            const TBInfo = DBValues.DATABASES.SGE.TABLES.CONTROL_NUMBERS;
                            let validation = await validate.validateControlNumber(controlNumber);
                            const SQLInsert = `INSERT INTO ${TBInfo.NAME}(
                                ${TBInfo.COLUMNS.CONTROL_NUMBER.NAME},
                                ${TBInfo.COLUMNS.VALID.NAME}
                            ) VALUES (?,?)`;
                            if (validation.status === 200) {
                                db.run(SQLInsert, [controlNumber, 1]);
                                console.log("Result: %s", colors.green(validation.message));
                            } else {
                                db.run(SQLInsert, [controlNumber, 0]);
                                console.log("Error: %s", colors.red(validation.getMessage()));
                            }
                            db.close(dbClosed);
                        } catch (exception) {
                            console.log(colors.red(exception));
                        }
                    }
                });
            }
        });
    });

commander
    .command('password <controlNumber> [options]')
    .alias('p')
    .description('Search for the password of this control number using all your cores or you can specify the ammount manually')
    .action(async (controlNumber, cores) => {
        console.log(colors.blue('PASSWORD SEARCHER'));
        let db = new sqlite3.Database(`${__dirname}/db/${DBValues.DATABASES.SGE.NAME}`, sqlite3.OPEN_READWRITE, async (err) => {
            if (err) {
                console.log('Error: %s', colors.red("Couldn't open the database"));
                console.log('Solution: %s', colors.yellow("Create database with createDatabase command"));
            } else {
                const TBInfo = DBValues.DATABASES.SGE.TABLES.CONTROL_NUMBERS;
                const SQLSearch = `SELECT 
                        ${TBInfo.COLUMNS.ID.NAME}, 
                        ${TBInfo.COLUMNS.VALID.NAME}
                    FROM ${TBInfo.NAME}
                    WHERE ${TBInfo.COLUMNS.CONTROL_NUMBER.NAME} = ?`;
                db.get(SQLSearch, controlNumber, async (err, res) => {
                    if (err) {
                        console.log('Error: %s', colors.red("Couldn't retrieve the control numbers"));
                        db.close(dbClosed);
                    } else if (res) {
                        const CORES = commander.cores || os.cpus().length;
                        console.log(colors.gray(`Using ${colors.yellow(CORES)} cores`));
                        const pool = new Pool(cores);
                        let part = Math.round(MAX_VAL / CORES);
                        let counter = 0;
                        for (let index = 0; index < CORES; index++) {
                            let from = counter;
                            let to = counter += part;
                            process.stdout.write(colors.gray(` - Thread ${colors.yellow(index)} with range: [${colors.white(from.toString().padStart(6,'0'))} - ${colors.white(to)}]\n`));
                            pool.run('/login.js')
                                .send({
                                    controlNumber: controlNumber,
                                    index: from,
                                    max: to
                                });
                        }

                        pool.on('done', function (job, res) {
                                console.log('done', res);
                                if (res.status === 200) {
                                    const SQLInsert = `UPDATE ${TBInfo.TABLES.CONTROL_NUMBERS.NAME} 
                                            SET ${TBInfo.CONTROL_NUMBERS.COLUMNS.PASSWORD.NAME} = ?
                                            WHERE ${TBInfo.CONTROL_NUMBERS.COLUMNS.CONTROL_NUMBER.NAME} = ?`;
                                        db.run(SQLInsert, [res.message, controlNumber]);
                                        console.log(colors.gray('Password stored'));
                                    console.log('Result: %s', res.message)
                                    pool.killAll();
                                    db.close(dbClosed);
                                } else {
                                    console.log(colors.gray("Job finished and didn't find the password in the range"));
                                }
                            })
                            .on('error', function (job, error) {
                                console.log('Error: ', error);
                            })
                            .on('finished', function () {
                                console.log('Info: %s', colors.red("Couldn't find the password"));
                                pool.killAll();
                                db.close(dbClosed);
                            });
                    } else {
                        db.close(dbClosed);
                        console.log('Info: %s', colors.yellow("Validate the Control Number before"));
                    }
                });
            }
        });
    });

commander.parse(process.argv);

function dbClosed(err) {
    if (err) {
        console.log('Error: %s', colors.red("Couldn't close the database"));
    }
}
