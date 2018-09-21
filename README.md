#Retrieve SGE
####CLI to validate your Control Number and get your password from [SGE](https://sge.mexicali.tecnm.mx/login)

###Installation
To start using the CLI, you first need to have [NodeJS](https://nodejs.org/) installed using either of the two options presented should do just fine.

Once you have [NodeJS](https://nodejs.org/) installed just clone the repository:
```
git clone https://github.com/AlecsisDuarte/retrieve-sge.git && cd retrieve-sge
```

Then inside the root folder of the project install all the node modules using the node package manager command like this:
```
npm install
```
Once all node modules are install you'll need to make the script executable:
```
chmod +x retrieve-sge.js
```
After all that you will be able to use the CLI but if you want to get rid of the need of always going to the root of the project to run it's commands, you can use the next command to make the executable global:
```
npm link
```


###Usage
Once installed, the CLI usage is really simple.
It comes with 4 commands:
1. `-h`
   Used to get information of the other commands
2. `createDatabase|create`
   This command creates an SQLite database where all your Control Numbers validations and passwords will be stored. 
   In order to use the other 2 commands is necesary that you create the database.
3. `validate|v <controlNumber>` 
   Use this command to validate your Control Number, you must do this before you try to reteive your password
4. `password|p <controlNumber> [cores]`
   Once you created the database and validated the control number, you can start the process of password retrieving, where the application it's going to use brute force to get it.
   In order to speed up the process the applicaction is able to get the ammount of cores your system has and start the ammount of jobs accordingly or you could specify it your self in case you don't want to use all of your cores.

In order to make use of the commands and if you didn't use the `npm link` command you will need to type `./retrieve-sge.js` before the command and inside the root folder of the project, otherwise you could run the commands using `retrieve-sge` from anywhere.
For example, in order to create the database you would use:
```
./retrieve-sge.js createDatabase
```
or
```
retrieve-sge create
```

If you want to validate your password you would use:
```
./retrieve-sge.js validate 19999999
```
or
```
retrieve-sge v 19999999
```

###Notes
* *It is advice that if you are able to retrieve your password using this application you **change it**, as this means your account is vurnerable to brute force attacks like this one.*

* *If you already changed your password and this has other than **6 digits numbers**, this application won't be able to retrieve it.*