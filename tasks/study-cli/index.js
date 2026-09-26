import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "fs";
const rl = readline.createInterface({ input, output });
const filename = "subjects.json";
console.log("Welcome to the Node.js study cli! Type 'exit' to quit.");
while (true) {
    const answer = await rl.question("> ");
    if (answer.toLowerCase() === "exit") {
        break;
    }
    switch (answer.toLowerCase().split(" ")[0]) {
        case "hello":
            console.log("Hello! How can I help you?");
            break;
        case "add":
            addSubject(answer.toLowerCase().split(" ")[1])
            break;
        case "remove":
            remove(answer.toLowerCase().split(" ")[1])
            break;
        case "show":
            showSubjects();
            break;
        case "help":
            console.log("Available commands: hello, help, exit");
            break;
        default:
            console.log(`Unknown command: ${answer}`);
    }
 
}


rl.close();

function addSubject(subject) {
    // This function adds a subject to the list of subjects.
    // For now, it just logs the subject to the console.

    //make text without spacing
    // fs.appendFile(filename, subject, () =>
    //     console.log(`Adding subject: ${subject}`)

    // )
    fs.readFile(filename, (err, data) => {
        if (err) {
            if (err.code === "ENOENT") {
                fs.appendFile(filename, JSON.stringify([subject]), () =>
                    console.log(`Adding subject: ${subject}`)
                )
            }
        } else {
            const subjects = JSON.parse(data);
            if (subjects.includes(subject.toLowerCase)) {
                console.log(`Subject ${subject} already exists.`);
                return;
            }
            subjects.push(subject.toLowerCase());
            fs.writeFile(filename, JSON.stringify(subjects), () =>
                console.log(`Adding subject: ${subject}`)
            )
        }
    })
}
function showSubjects() {
    fs.readFile(filename, (error,data) => {
        if (error) {
            console.log("File not excits")
        }

        if (data) {
            const answer = JSON.parse(data).join(" ");
            console.log(answer);
        }
    })
}

function remove(subject) {
    fs.readFile(filename, (error,data) => {
        if (error) {
            console.log("File not found");
            return;
        }
        const subjects = JSON.parse(data);
        const index = subjects.indexOf(subject.toLowerCase());
        if (index !== -1) {
            subjects.splice(index, 1);
            fs.writeFile(filename, JSON.stringify(subjects), () =>
                console.log(`Removing subject: ${subject}`)
            );
        } else {
            console.log(`Subject ${subject} not found.`);
        }
    })
}