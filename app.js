// Setup initial state
let tasks = [];

// Get DOM elements
const todoList = document.getElementById("todo-list");
const filterInput = document.getElementById("filter");
const sortSelect = document.getElementById("sort");
const addTaskButton = document.getElementById("add-task-btn");
const taskDateInput = document.getElementById("task-date");

// Render tasks to the list
function renderTasks() {
    todoList.innerHTML = "";
    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${task.text}
            <button data-index="${index}">×</button>
        `;
        todoList.appendChild(li);
    });

    // Add delete functionality
    todoList.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            tasks.splice(index, 1);
            renderTasks();
        });
    });
}

// Add task function
function addTask() {
    const taskText = prompt("Enter task description:");
    const taskDate = taskDateInput.value || new Date().toLocaleDateString();
    if (taskText) {
        tasks.push({ text: taskText, date: taskDate });
        renderTasks();
    }
}

// Handle sorting
function sortTasks() {
    const sortType = sortSelect.value;
    if (sortType === "alphabetically") {
        tasks.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortType === "by-date") {
        tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    renderTasks();
}

// Handle filtering
function filterTasks() {
    const query = filterInput.value.toLowerCase();
    const filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(query));
    renderFilteredTasks(filteredTasks);
}

// Render filtered tasks
function renderFilteredTasks(filteredTasks) {
    todoList.innerHTML = "";
    filteredTasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${task.text}
            <button data-index="${index}">×</button>
        `;
        todoList.appendChild(li);
    });
}

// Event listeners
addTaskButton.addEventListener('click', addTask);
sortSelect.addEventListener('change', sortTasks);
filterInput.addEventListener('input', filterTasks);

// Initial render
renderTasks();
