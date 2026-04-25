function $(id)
{
	return document.getElementById(id);
}

function setHidden(element, hidden, visibleDisplay)
{
	element.style.display = hidden ? "none" : (visibleDisplay || "block");
}

var game = window.game || {};
var gamePrompt = window.gamePrompt || {};

window.game = game;
window.gamePrompt = gamePrompt;

game.config = window.JEOPARDY_CONFIG || {};
game.current_points = 0;
game.current_questionID = null;
game.team_cnt = 0;

game.getActiveCategories = function()
{
	var categoryCount = game.config.board.categoryCount;
	return game.config.categories.slice(0, categoryCount);
};

game.getPointValue = function(rowIndex)
{
	return game.config.board.basePointValue + (rowIndex * game.config.board.pointIncrement);
};

game.renderBoard = function()
{
	if(!game.config.board || !game.config.categories)
		throw new Error("Missing JEOPARDY_CONFIG board data.");

	var categories = game.getActiveCategories();
	var questionCount = game.config.board.questionsPerCategory;
	var theadRow = document.createElement("tr");
	var tbody = $("game").getElementsByTagName("tbody")[0];
	var thead = $("game").getElementsByTagName("thead")[0];

	if(categories.length < game.config.board.categoryCount)
		throw new Error("Not enough categories in JEOPARDY_CONFIG.");

	document.title = game.config.title;
	document.querySelector("#options h1").textContent = game.config.title;

	thead.innerHTML = "";
	tbody.innerHTML = "";

	for(var c = 0; c < categories.length; c++)
	{
		if(categories[c].questions.length < questionCount)
			throw new Error("Category '" + categories[c].title + "' does not have enough questions.");

		var headerCell = document.createElement("th");
		headerCell.innerHTML = categories[c].title;
		theadRow.appendChild(headerCell);
	}

	thead.appendChild(theadRow);

	for(var r = 0; r < questionCount; r++)
	{
		var row = document.createElement("tr");

		for(var col = 0; col < categories.length; col++)
		{
			var clue = categories[col].questions[r];
			var questionID = "q" + r + col;
			var points = game.getPointValue(r);
			var cell = document.createElement("td");
			var heading = document.createElement("h3");

			cell.id = "t" + questionID;
			cell.className = "cell clean";
			cell.dataset.questionId = questionID;
			cell.dataset.points = String(points);
			cell.dataset.categoryTitle = categories[col].title;
			cell.dataset.answer = clue.answer;
			cell.dataset.question = clue.question;
			cell.onclick = function() {
				gamePrompt.show(this);
			};
			cell.onmouseover = function() {
				if(this.className.indexOf("clean") !== -1)
					this.classList.add("ie-hack");
			};
			cell.onmouseout = function() {
				this.classList.remove("ie-hack");
			};

			heading.textContent = points;
			cell.appendChild(heading);
			row.appendChild(cell);
		}

		tbody.appendChild(row);
	}
};

game.init = function()
{
	setHidden($("options"), true);
	setHidden($("stats"), false, "block");
	$("game").classList.remove("hide");
	setHidden($("game"), false, "table");
	game.team_cnt = parseInt($("teams").value, 10);
	game.current_points = 0;
	game.createScoreboard();
};

game.createScoreboard = function()
{
	var table = document.createElement("table");
	var tbody = document.createElement("tbody");
	var namesRow = document.createElement("tr");
	var scoresRow = document.createElement("tr");

	table.setAttribute("cellspacing", "10");

	for(var i = 1; i <= game.team_cnt; i++)
	{
		var nameHeader = document.createElement("th");
		var nameInput = document.createElement("input");
		var scoreCell = document.createElement("td");
		var scoreHeading = document.createElement("h3");
		var addButton = document.createElement("input");
		var subtractButton = document.createElement("input");

		nameInput.className = "team-name";
		nameInput.type = "text";
		nameInput.value = "Team " + i;
		nameHeader.appendChild(nameInput);
		namesRow.appendChild(nameHeader);

		scoreHeading.id = "team" + i;
		scoreHeading.textContent = "0";

		addButton.className = "add-points";
		addButton.type = "button";
		addButton.value = "+";
		addButton.onclick = game.addPoints.bind(null, i);

		subtractButton.className = "subtract-points";
		subtractButton.type = "button";
		subtractButton.value = "-";
		subtractButton.onclick = game.subtractPoints.bind(null, i);

		scoreCell.appendChild(scoreHeading);
		scoreCell.appendChild(addButton);
		scoreCell.appendChild(document.createTextNode(" "));
		scoreCell.appendChild(subtractButton);
		scoresRow.appendChild(scoreCell);
	}

	tbody.appendChild(namesRow);
	tbody.appendChild(scoresRow);
	table.appendChild(tbody);

	$("stats").innerHTML = "";
	$("stats").appendChild(table);
};

game.addPoints = function(team)
{
	var scoreNode = $("team" + team);
	var points = parseInt(scoreNode.textContent, 10) + game.current_points;

	scoreNode.textContent = String(points);
	game.markQuestionUsed();
};

game.subtractPoints = function(team)
{
	var scoreNode = $("team" + team);
	var points = parseInt(scoreNode.textContent, 10) - game.current_points;

	scoreNode.textContent = String(points);
	game.markQuestionUsed();
};

game.markQuestionUsed = function()
{
	if(!game.current_questionID)
		return;

	var cell = $("t" + game.current_questionID);
	if(!cell)
		return;

	cell.classList.add("dirty");
	cell.classList.remove("clean");
	cell.classList.remove("ie-hack");
	cell.onclick = null;
	cell.onmouseover = null;
	cell.onmouseout = null;

	var heading = cell.getElementsByTagName("h3")[0];
	if(heading)
		heading.innerHTML = "&nbsp;";
};

gamePrompt.show = function(cellNode)
{
	game.current_points = parseInt(cellNode.dataset.points, 10);
	game.current_questionID = cellNode.dataset.questionId;
	setHidden($("question"), true);
	setHidden($("game"), true);
	setHidden($("prompt"), false, "block");
	$("prompt-title").innerHTML = cellNode.dataset.categoryTitle + " for " + cellNode.dataset.points + ":";
	$("question").textContent = cellNode.dataset.question;
	$("answer").textContent = cellNode.dataset.answer;
	setHidden($("correct-response"), $("question").textContent.length === 0);
};

gamePrompt.hide = function()
{
	game.markQuestionUsed();
	setHidden($("prompt"), true);
	setHidden($("game"), false, "table");
};

gamePrompt.showQuestion = function()
{
	setHidden($("question"), false, "block");
};

document.addEventListener("DOMContentLoaded", function() {
	game.renderBoard();
});
