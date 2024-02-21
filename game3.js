const crypto = require("crypto");
const readline = require("readline");

class KeyGenerator {
  static generateKey() {
    return crypto.randomBytes(32).toString("hex");
  }
}

class HMACGenerator {
  static generateHMAC(key, data) {
    const hmac = crypto.createHmac("sha3-256", key);
    hmac.update(data);
    return hmac.digest("hex");
  }
}

class Rules {
  static determineWinner(compMove, userMove, moves) {
    const n = moves.length;
    const p = Math.floor(n / 2);
    const a = moves.indexOf(compMove);
    const b = moves.indexOf(userMove);
    const result = Math.sign(((a - b + p + n) % n) - p);

    if (result === 0) {
      return "Draw!";
    } else if (result === 1) {
      return "Computer win!";
    } else {
      return "You win!";
    }
  }
}

class HelpTableGenerator {
  static generateHelpTable(moves) {
    const n = moves.length;
    const maxLength = Math.max(...moves.map((move) => move.length));

    const headerRow = ["v PC\\User >"];
    moves.forEach((move) => headerRow.push(move.padEnd(maxLength)));

    const table = [headerRow];

    for (let i = 0; i < n; i++) {
      const row = [moves[i].padEnd(maxLength)];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row.push("Draw".padEnd(maxLength));
        } else {
          const result = Rules.determineWinner(moves[j], moves[i], moves);
          let cellContent = "";
          if (result === "You win!") {
            cellContent = "Win";
          } else if (result === "Computer win!") {
            cellContent = "Lose";
          } else {
            cellContent = result;
          }
          row.push(cellContent.padEnd(maxLength));
        }
      }
      table.push(row);
    }

    const formattedTable = table.map(
      (row) =>
        "| " + row.map((cell) => cell.slice(0, maxLength)).join(" | ") + " |"
    );

    const separator = formattedTable[0].replace(/[^\|]/g, "-");

    let helpTable = separator + "\n";
    formattedTable.forEach((row) => {
      helpTable += row + "\n";
      helpTable += separator + "\n";
    });

    return helpTable;
  }
}

class Game {
  constructor(moves) {
    if (moves.length % 2 === 0 || moves.length < 3) {
      throw new Error(
        "Invalid number of moves. Please provide an odd number of unique moves >= 3."
      );
    }

    if (new Set(moves).size !== moves.length) {
      throw new Error("Moves should be unique.");
    }

    this.moves = moves;
    this.compMove = this.computerMove();
    this.secureKey = KeyGenerator.generateKey();
    this.compHMAC = HMACGenerator.generateHMAC(this.secureKey, this.compMove);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.rl.on("line", () => {
      this.rl.pause();
    });
  }

  computerMove() {
    const rand = Math.floor(Math.random() * this.moves.length);
    return this.moves[rand];
  }

  menu() {
    console.log("Available moves:");
    this.moves.forEach((move, index) => console.log(`${index + 1}. ${move}`));
    console.log("0. Exit");
    console.log("?. Help");

    this.rl.resume();

    this.rl.question("Enter your move: ", (choice) => {
      if (choice === "?") {
        console.log("Help:");
        const helpTable = HelpTableGenerator.generateHelpTable(this.moves);
        console.log(helpTable);
        this.menu();
        return;
      }

      const moveIndex = parseInt(choice);
      if (moveIndex === 0) {
        console.log("Exiting the game...");
        this.rl.close();
        return;
      }
      if (isNaN(moveIndex) || moveIndex < 1 || moveIndex > this.moves.length) {
        console.log("Invalid move. Please enter a valid move number.");
        this.menu();
        return;
      }
      this.play(moveIndex - 1);
    });
  }

  play(userMoveIndex) {
    const userMove = this.moves[userMoveIndex];
    const userHMAC = HMACGenerator.generateHMAC(this.secureKey, userMove);
    const result = Rules.determineWinner(this.compMove, userMove, this.moves);

    console.log("Your move:", userMove);
    console.log("Computer move:", this.compMove);
    console.log("Result:", result);
    console.log("HMAC key:", this.secureKey);

    this.rl.close();
  }
}

const moves = process.argv.slice(2);

try {
  const game = new Game(moves);
  console.log("HMAC:", game.compHMAC);
  game.menu();
} catch (error) {
  console.error(error.message);
}
