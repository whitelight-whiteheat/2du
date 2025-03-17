// Simple Task Manager with localStorage
class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        
        // Bind methods to this instance
        this.handleTagClick = this.handleTagClick.bind(this);
        
        this.initializeEventListeners();
        
        // Determine which page we're on
        const isCompletedPage = window.location.pathname.includes('completed.html');
        const isTagFilterPage = window.location.pathname.includes('tagfilter.html');
        const isUpcomingPage = window.location.pathname.includes('upcoming.html');
        
        if (isCompletedPage) {
            this.displayCompletedTasks();
        } else if (isTagFilterPage) {
            this.displayTagFilterPage();
        } else if (isUpcomingPage) {
            this.displayUpcomingTasks();
        } else {
            this.displayTasks();
        }
        
        this.updateDateDisplay();
    }

    // Load tasks from localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            try {
                this.tasks = JSON.parse(savedTasks);
                console.log('Loaded tasks:', this.tasks);
            } catch (e) {
                console.error('Error loading tasks:', e);
                this.tasks = [];
            }
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        console.log('Saved tasks:', this.tasks);
    }

    // Display tasks on the main page (non-completed tasks)
    displayTasks() {
        const tasksList = document.getElementById('today-tasks');
        if (!tasksList) return;

        // Filter for non-completed tasks
        const activeTasks = this.tasks.filter(task => !task.completed);

        if (activeTasks.length === 0) {
                tasksList.innerHTML = `
                    <li class="empty-state">
                        <i class="fas fa-check"></i>
                        No tasks scheduled for today
                    </li>
                `;
            return;
        }

        // Clear the list
        tasksList.innerHTML = '';

        // Add each task to the list
        activeTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = 'task-item';
            taskElement.dataset.taskId = task.id;
            
            taskElement.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                        <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.dueDate ? `
                        <div class="task-metadata">
                            <span class="task-date">
                                <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                    ` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => {
                                // Get a color number based on the first character of the tag
                                const colorNum = tag.charCodeAt(0) % 10;
                                return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="delete-task">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            tasksList.appendChild(taskElement);
        });
        
        // Update task counts
        this.updateTaskCounts();
        
        // After adding tasks to the DOM
        this.makeTagsClickable();
    }
    
    // Display completed tasks on the completed page
    displayCompletedTasks() {
        const completedTasksContainer = document.getElementById('completed-tasks');
        if (!completedTasksContainer) return;
        
        // Filter for completed tasks
        const completedTasks = this.tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            completedTasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No completed tasks yet</p>
                </div>
            `;
            return;
        }
        
        // Clear the container
        completedTasksContainer.innerHTML = '';
        
        // Add each completed task
        completedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item completed';
            taskElement.dataset.taskId = task.id;
            
            taskElement.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" checked>
                    <span class="checkmark"></span>
                </label>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    ${task.dueDate ? `
                        <div class="task-metadata">
                            <span class="task-date">
                                <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                    ` : ''}
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => {
                                // Get a color number based on the first character of the tag
                                const colorNum = tag.charCodeAt(0) % 10;
                                return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="delete-task">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            completedTasksContainer.appendChild(taskElement);
        });
        
        // Make tags clickable
        this.makeTagsClickable();
    }

    // Display tasks filtered by tag
    displayTagFilterPage() {
        const taggedTasksContainer = document.getElementById('tagged-tasks');
        if (!taggedTasksContainer) return;
        
        // Get the selected tag from localStorage
        const selectedTag = localStorage.getItem('selectedTag');
        if (!selectedTag) {
            taggedTasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <p>No tag selected</p>
                </div>
            `;
            return;
        }
        
        // Filter tasks by the selected tag
        const tasksWithTag = this.tasks.filter(task => 
            task.tags && task.tags.includes(selectedTag) && !task.completed
        );
        
        // Display tasks with the selected tag
        taggedTasksContainer.innerHTML = `
            <h3><i class="fas fa-tag"></i> Tasks with tag: ${selectedTag}</h3>
            ${tasksWithTag.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No active tasks with this tag</p>
                </div>
            ` : `
                <ul class="tasks-list">
                    ${tasksWithTag.map(task => `
                        <li class="task-item" data-task-id="${task.id}">
                            <label class="checkbox-container">
                                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                                <span class="checkmark"></span>
                            </label>
                            <div class="task-content">
                                <div class="task-title">${task.title}</div>
                                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                                <div class="task-metadata">
                                    ${task.dueDate ? `
                                        <span class="task-date">
                                            <i class="fas fa-calendar"></i> ${new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    ` : ''}
                                </div>
                                <div class="task-tags">
                                    ${task.tags.map(tag => {
                                        // Get a color number based on the first character of the tag
                                        const colorNum = tag.charCodeAt(0) % 10;
                                        return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                            <button class="delete-task">
                                <i class="fas fa-trash"></i>
                            </button>
                        </li>
                    `).join('')}
                </ul>
            `}
        `;
        
        // Make tags clickable
        this.makeTagsClickable();
    }

    // Display upcoming tasks
    displayUpcomingTasks() {
        const upcomingTasksContainer = document.getElementById('upcoming-tasks');
        if (!upcomingTasksContainer) return;

        // Get future tasks (not completed and due date is in the future)
        const futureTasks = this.getFutureTasks();
        
        if (futureTasks.length === 0) {
            upcomingTasksContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                    <p>No upcoming tasks</p>
                    </div>
                `;
                return;
            }

            // Group tasks by date
        const tasksByDate = {};
        futureTasks.forEach(task => {
            const date = new Date(task.dueDate);
            const dateStr = date.toISOString().split('T')[0];
            
            if (!tasksByDate[dateStr]) {
                tasksByDate[dateStr] = [];
            }
            
            tasksByDate[dateStr].push(task);
        });

        // Sort dates
        const sortedDates = Object.keys(tasksByDate).sort();

        // Create HTML
        upcomingTasksContainer.innerHTML = '';
        
        sortedDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const formattedDate = date.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const dateSection = document.createElement('div');
            dateSection.className = 'date-section';
            dateSection.innerHTML = `
                <h3 class="date-heading">
                        <i class="fas fa-calendar-day"></i>
                    ${formattedDate}
                    </h3>
                    <ul class="tasks-list">
                    ${tasksByDate[dateStr].map(task => `
                            <li class="task-item" data-task-id="${task.id}">
                            <label class="checkbox-container">
                                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                                <span class="checkmark"></span>
                            </label>
                                <div class="task-content">
                                    <div class="task-title">${task.title}</div>
                                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                                ${task.tags && task.tags.length > 0 ? `
                                    <div class="task-tags">
                                        ${task.tags.map(tag => {
                                            // Get a color number based on the first character of the tag
                                            const colorNum = tag.charCodeAt(0) % 10;
                                            return `<span class="tag" data-color="${colorNum}">${tag}</span>`;
                                        }).join('')}
                                </div>
                                    ` : ''}
                                </div>
                            <button class="delete-task">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </li>
                        `).join('')}
                    </ul>
            `;
            
            upcomingTasksContainer.appendChild(dateSection);
        });
        
        // Make tags clickable
        this.makeTagsClickable();
    }

    // Helper method to get future tasks
    getFutureTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow
        
        return this.tasks.filter(task => {
            if (!task.dueDate || task.completed) return false;
            
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            
            // Only include tasks with dates strictly after today
            return taskDate >= tomorrow;
        });
    }

    // Update task counts
    updateTaskCounts() {
        const completedCount = document.getElementById('completed-count');
        const remainingCount = document.getElementById('remaining-count');
        const progressFill = document.getElementById('tasks-progress-fill');
        
        if (!completedCount || !remainingCount) return;
        
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const activeTasks = this.tasks.filter(task => !task.completed).length;
        
        completedCount.textContent = completedTasks;
        remainingCount.textContent = activeTasks;
        
        if (progressFill) {
            const total = completedTasks + activeTasks;
            const progress = total > 0 ? (completedTasks / total) * 100 : 0;
            progressFill.style.width = `${progress}%`;
        }
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Quick add button
        const quickAddBtn = document.getElementById('quick-add-btn');
        const taskModal = document.getElementById('task-modal');

        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => {
                taskModal.style.display = 'block';
            });
        }

        // Close modal buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                taskModal.style.display = 'none';
                const form = document.getElementById('task-form');
                if (form) form.reset();
            });
        });

        // Form submission
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const title = document.getElementById('task-title').value.trim();
                if (!title) return;
                
                // Create a simple task
                const task = {
                    id: Date.now(),
                    title: title,
                    description: document.getElementById('task-description').value.trim(),
                    dueDate: document.getElementById('task-date').value || new Date().toISOString().split('T')[0],
                    tags: document.getElementById('task-tags').value ? 
                          document.getElementById('task-tags').value.split(',').map(tag => tag.trim()) : 
                          [],
                    completed: false
                };
                
                // Add to array
                this.tasks.push(task);
                
                // Save to localStorage
                this.saveTasks();
                
                // Update display
                this.displayTasks();
                
                // Close modal and reset form
                    taskModal.style.display = 'none';
                    taskForm.reset();
            });
        }

        // Delete task
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-task')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);
                
                // Remove from array
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                
                // Save to localStorage
                this.saveTasks();
                
                // Update display based on current page
                if (window.location.pathname.includes('completed.html')) {
                    this.displayCompletedTasks();
                } else if (window.location.pathname.includes('tagfilter.html')) {
                    this.displayTagFilterPage();
                } else if (window.location.pathname.includes('upcoming.html')) {
                    this.displayUpcomingTasks();
                } else {
                    this.displayTasks();
                }
            }
        });

        // Toggle task completion
        document.addEventListener('change', (e) => {
            if (e.target.closest('input[type="checkbox"]')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);
                const task = this.tasks.find(t => t.id === taskId);
                
                if (task) {
                    const isCompleting = e.target.checked;
                    
                    if (isCompleting) {
                        // Mark as completed and record completion date
                        task.completed = true;
                        task.completedAt = new Date().toISOString();
                        
                        // Add completion animation
                        taskItem.classList.add('completing');
                        
                        // Play animation then update the display
                        setTimeout(() => {
                            this.saveTasks();
                            
                            // Update the appropriate display
                            if (window.location.pathname.includes('tagfilter.html')) {
                                this.displayTagFilterPage();
                            } else if (window.location.pathname.includes('upcoming.html')) {
                                this.displayUpcomingTasks();
                            } else {
                                this.displayTasks();
                            }
                            
                            // Show a notification that the task was completed
                            this.showNotification('Task completed and moved to Completed tab');
                        }, 800); // Animation duration
                    } else {
                        // If unchecking, remove completion status and date
                        task.completed = false;
                        delete task.completedAt;
                        
                        this.saveTasks();
                        
                        // Update the appropriate display
                        if (window.location.pathname.includes('completed.html')) {
                            this.displayCompletedTasks();
                        } else if (window.location.pathname.includes('tagfilter.html')) {
                            this.displayTagFilterPage();
                        } else if (window.location.pathname.includes('upcoming.html')) {
                            this.displayUpcomingTasks();
                        } else {
                            this.displayTasks();
                        }
                    }
                }
            }
        });

        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const appContainer = document.querySelector('.app-container');
        
        if (sidebarToggle && appContainer) {
            sidebarToggle.addEventListener('click', () => {
                appContainer.classList.toggle('sidebar-collapsed');
                
                const icon = sidebarToggle.querySelector('i');
                if (icon) {
                    if (appContainer.classList.contains('sidebar-collapsed')) {
                        icon.classList.remove('fa-chevron-left');
                        icon.classList.add('fa-chevron-right');
                    } else {
                        icon.classList.remove('fa-chevron-right');
                        icon.classList.add('fa-chevron-left');
                    }
                }
            });
        }

        // Calendar link
        const calendarLink = document.getElementById('calendar-link');
        const calendarModal = document.getElementById('calendar-modal');
        
        if (calendarLink && calendarModal) {
            calendarLink.addEventListener('click', (e) => {
                e.preventDefault();
                calendarModal.style.display = 'block';
                this.initializeCalendar();
            });
            
            // Close calendar modal
            const calendarCloseButtons = calendarModal.querySelectorAll('.close-modal');
            calendarCloseButtons.forEach(button => {
                button.addEventListener('click', () => {
                    calendarModal.style.display = 'none';
                });
            });
            
            // Close on outside click
            window.addEventListener('click', (e) => {
                if (e.target === calendarModal) {
                    calendarModal.style.display = 'none';
                }
            });
        }
    }

    // Make tags clickable
    makeTagsClickable() {
        // Find all tag elements
        const tagElements = document.querySelectorAll('.tag');
        
        tagElements.forEach(tagElement => {
            // Add pointer cursor
            tagElement.style.cursor = 'pointer';
            
            // Remove any existing click listeners to prevent duplicates
            tagElement.removeEventListener('click', this.handleTagClick);
            
            // Add click event listener
            tagElement.addEventListener('click', this.handleTagClick);
        });
    }

    // Separate handler function for tag clicks
    handleTagClick(e) {
        e.stopPropagation(); // Prevent event bubbling
        
        const tagName = e.target.textContent.trim();
        
        // Save the selected tag to localStorage
        localStorage.setItem('selectedTag', tagName);
        
        // Redirect to tags page
        window.location.href = 'tagfilter.html';
    }

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
            }, 300);
        }, 3000);
    }

    // Initialize calendar
    initializeCalendar() {
        const calendarMonthYear = document.getElementById('calendar-month-year');
        const calendarDays = document.getElementById('calendar-days');
        
        if (!calendarMonthYear || !calendarDays) return;
        
        // Get current date
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Set month and year
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Generate calendar days
        calendarDays.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = i;
            
            // Highlight current day
            if (i === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
                dayElement.classList.add('current-day');
            }
            
            calendarDays.appendChild(dayElement);
        }
    }

    // Update date display
    updateDateDisplay() {
        const dateDisplay = document.querySelector('.date-display');
        if (dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
