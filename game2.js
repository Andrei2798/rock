const crypto = require("crypto");
const readline = require("readline");

// Класс для генерации криптостойкого случайного ключа
class KeyGenerator {
  static generateKey() {
    return crypto.randomBytes(32).toString("hex"); // Генерируем 256 битный ключ
  }
}

// Класс для генерации HMAC
class HMACGenerator {
  static generateHMAC(key, data) {
    const hmac = crypto.createHmac("sha3-256", key); // Создаем HMAC на основе алгоритма SHA3-256 и ключа
    hmac.update(data); // Подаём данные для хеширования
    return hmac.digest("hex"); // Получаем HMAC в шестнадцатеричном формате
  }
}

// Класс для определения правил игры и победителя
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

// Основной класс игры
class Game {
  constructor(moves) {
    if (moves.length % 2 === 0 || moves.length < 3) {
      throw new Error(
        "Invalid number of moves. Please provide an odd number of unique moves >= 3."
      );
    }

    // Проверка на уникальность ходов
    if (new Set(moves).size !== moves.length) {
      throw new Error("Moves should be unique.");
    }

    this.moves = moves;
    this.compMove = this.computerMove();
    this.secureKey = KeyGenerator.generateKey();
    this.compHMAC = HMACGenerator.generateHMAC(this.secureKey, this.compMove);

    // Инициализируем объект readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Добавляем обработчик события line
    this.rl.on("line", () => {
      this.rl.pause(); // При получении ввода, сразу приостанавливаем чтение из потока ввода
    });
  }

  computerMove() {
    const rand = Math.floor(Math.random() * this.moves.length);
    return this.moves[rand];
  }

  menu() {
    console.log("Available moves:");
    this.moves.forEach((move, index) => console.log(`${index + 1}. ${move}`));
    console.log("0. Exit"); // Добавляем пункт для выхода
    console.log("?. Help"); // Добавляем пункт для получения справки

    this.rl.resume(); // Возобновляем чтение из потока ввода

    this.rl.question("Enter your move: ", (choice) => {
      if (choice === "?") {
        console.log("Help:");
        const helpTable = this.generateHelpTable();
        console.log(helpTable);
        this.menu(); // Вызываем меню заново
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
        this.menu(); // Вызываем меню заново в случае неправильного выбора
        return;
      }
      this.play(moveIndex - 1); // Передаем объект интерфейса ввода-вывода в метод play()
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

    this.rl.close(); // Закрываем интерфейс ввода-вывода после вывода результата
  }

  generateHelpTable() {
    const n = this.moves.length;
    const maxLength = Math.max(...this.moves.map((move) => move.length));

    // Создаем заголовок таблицы
    const headerRow = ["v PC\\User >"];
    this.moves.forEach((move) => headerRow.push(move.padEnd(maxLength)));

    const table = [headerRow];

    // Заполняем ячейки таблицы
    for (let i = 0; i < n; i++) {
      const row = [this.moves[i].padEnd(maxLength)];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row.push("Draw".padEnd(maxLength));
        } else {
          const result = Rules.determineWinner(
            this.moves[j],
            this.moves[i],
            this.moves
          );
          let cellContent = "";
          if (result === "You win!") {
            cellContent = "Win";
          } else if (result === "Computer wins!") {
            cellContent = "Lose";
          } else {
            cellContent = result;
          }
          row.push(cellContent.padEnd(maxLength));
        }
      }
      table.push(row);
    }

    // Форматируем таблицу
    const formattedTable = table.map(
      (row) =>
        "| " + row.map((cell) => cell.slice(0, maxLength)).join(" | ") + " |"
    );

    // Генерируем разделитель
    const separator = formattedTable[0].replace(/[^\|]/g, "-");

    // Собираем окончательную таблицу в виде строки
    let helpTable = separator + "\n";
    formattedTable.forEach((row) => {
      helpTable += row + "\n";
      helpTable += separator + "\n";
    });

    return helpTable;
  }
}

// Пример использования:

const moves = process.argv.slice(2);

try {
  const game = new Game(moves);
  console.log("HMAC:", game.compHMAC); // Выводим HMAC хода компьютера
  game.menu();
} catch (error) {
  console.error(error.message);
}
