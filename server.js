function userStep(args) {
  args = process.argv.slice(2);
  return args;
}

function computerStep() {
  let avaliableSteps = ["rock", "paper", "scissors"];
  let rand = Math.floor(Math.random() * 3);

  return avaliableSteps[rand];
}

function determWinner() {
  let user = userStep();
  let computer = computerStep();
  console.log("user: " + user);
  console.log("computer: " + computer);

  if (user != "rock" && user != "paper" && user != "scissors") {
    console.log("Wrong choise!");
  } else {
    if (
      (user == "rock" && computer == "paper") ||
      (user == "parer" && computer == "scissors") ||
      (user == "scissors" && computer == "rock")
    ) {
      console.log("Computer is winner");
    } else if (user == computer) {
      console.log("Draw");
    } else {
      console.log("User is winner");
    }
  }
}

determWinner();
