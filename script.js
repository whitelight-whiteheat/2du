// Task Management System
class TaskManager {
    constructor() {
        console.log('Initializing TaskManager');
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        this.selectedTags = new Set();
        
        // Initialize
        this.initializeEventListeners();
        this.updateDashboard();
        this.updateDateDisplay();
    }

    // Add new task
    addTask(title, dueDate = null, tags = '', description = '') {
        if (!title) return null;

        const task = {
            id: Date.now(),
            title,
            dueDate: dueDate ? this.adjustDateForTimezone(dueDate) : null,
            description,
            completed: false,
            createdAt: new Date().toISOString(),
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.addActivity(`Created task: ${title}`);
        this.updateTasksOverview();
        
        return task;
    }

    // Toggle task completion
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.addActivity(`${task.completed ? 'Completed' : 'Uncompleted'} task: ${task.title}`);
            this.saveTasks();
            
            // Update the completed count immediately
            const completedTasks = this.getCompletedTasks();
            const todayTasks = this.getTodayTasks();
            const completedCount = document.getElementById('completed-count');
            const remainingCount = document.getElementById('remaining-count');
            
            if (completedCount) completedCount.textContent = completedTasks.length;
            if (remainingCount) remainingCount.textContent = todayTasks.length;
            
            // Update progress bar
            const progress = (todayTasks.length + completedTasks.length) > 0 
                ? (completedTasks.length / (todayTasks.length + completedTasks.length)) * 100 
                : 0;
            const progressFill = document.getElementById('tasks-progress-fill');
            if (progressFill) progressFill.style.width = `${progress}%`;
            
            // Update the appropriate view based on current page
            if (document.getElementById('completed-tasks')) {
                this.updateCompletedTasks();
            } else {
                this.updateTasksOverview();
            }
        }
    }

    // Delete task
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === parseInt(taskId));
        if (taskIndex > -1) {
            const [task] = this.tasks.splice(taskIndex, 1);
            this.addActivity(`Deleted task: ${task.title}`);
            this.saveTasks();
            this.updateDashboard();
        }
    }

    // Add activity
    addActivity(description) {
        const activity = {
            id: Date.now(),
            description,
            timestamp: new Date().toISOString()
        };

        this.activities.unshift(activity);
        if (this.activities.length > 10) {
            this.activities.pop();
        }
        this.saveActivities();
    }

    // Save to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    saveActivities() {
        localStorage.setItem('activities', JSON.stringify(this.activities));
    }

    // Update dashboard
    updateDashboard() {
        this.updateTasksOverview();
        this.updateUpcomingPreview();
        this.updateRecentActivity();
    }

    // Update tasks overview
    updateTasksOverview() {
        const todayTasks = this.getTodayTasks();
        const completedTasks = todayTasks.filter(task => task.completed);
        const completedCount = completedTasks.length;
        const remainingCount = todayTasks.length - completedCount;
        
        // Update stats
        const completedCountElement = document.getElementById('completed-count');
        const remainingCountElement = document.getElementById('remaining-count');
        const progressFillElement = document.getElementById('tasks-progress-fill');
        
        if (completedCountElement) completedCountElement.textContent = completedCount;
        if (remainingCountElement) remainingCountElement.textContent = remainingCount;
        
        // Update progress bar
        if (progressFillElement) {
            const progress = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;
            progressFillElement.style.width = `${progress}%`;
        }

        // Update tasks list
        const tasksList = document.getElementById('today-tasks');
        if (tasksList) {
            if (todayTasks.length === 0) {
                tasksList.innerHTML = `
                    <li class="empty-state">
                        <i class="fas fa-check"></i>
                        No tasks scheduled for today
                    </li>
                `;
            } else {
                tasksList.innerHTML = todayTasks
                    .sort((a, b) => !a.completed && b.completed ? -1 : a.completed && !b.completed ? 1 : 0)
                    .map(task => this.createTaskHTML(task))
                    .join('');
            }
        }
    }

    // Update upcoming preview
    updateUpcomingPreview() {
        const upcomingTasks = this.getUpcomingTasks();
        const previewList = document.getElementById('upcoming-preview');
        
        if (previewList) {
        if (upcomingTasks.length === 0) {
                previewList.innerHTML = `
                    <li class="empty-state">
                    <i class="fas fa-calendar"></i>
                        No upcoming tasks
                    </li>
                `;
            } else {
                previewList.innerHTML = upcomingTasks.map(task => `
                    <li>
                        <div class="task-content">
                            <p class="task-title">${task.title}</p>
                            <span class="task-date">${task.dueDate}</span>
                        </div>
                    </li>
                `).join('');
            }
        }
    }

    // Update recent activity
    updateRecentActivity() {
        const recentActivity = this.activities.slice(0, 3);
        const activityList = document.getElementById('recent-activity');
        
        if (activityList) {
            if (recentActivity.length === 0) {
                activityList.innerHTML = `
                    <li class="empty-state">
                        <i class="fas fa-history"></i>
                        No recent activity
                            </li>
                `;
            } else {
                activityList.innerHTML = recentActivity.map(activity => `
                    <li>
                        <div class="task-content">
                            <p class="task-title">${activity.description}</p>
                            <span class="activity-time">${this.formatTimestamp(activity.timestamp)}</span>
                        </div>
                    </li>
                `).join('');
            }
        }
    }

    // Get today's tasks
    getTodayTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.adjustDateForTimezone(today.toISOString().split('T')[0]);
        
        return this.tasks.filter(task => {
            if (!task.dueDate) return false;
            return task.dueDate === todayStr;
        });
    }

    // Get completed tasks
    getCompletedTasks() {
        return this.tasks.filter(task => task.completed);
    }

    // Get upcoming tasks
    getUpcomingTasks() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.adjustDateForTimezone(today.toISOString().split('T')[0]);

        return this.tasks
            .filter(task => !task.completed && task.dueDate && task.dueDate > todayStr)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    // Update upcoming tasks display
    updateUpcomingTasks() {
        const upcomingTasks = this.getUpcomingTasks();
        const upcomingContainer = document.getElementById('upcoming-tasks');
        
        if (upcomingContainer) {
            if (upcomingTasks.length === 0) {
                upcomingContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                        No upcoming tasks
                    </div>
                `;
                return;
            }

            // Group tasks by date
            const groupedTasks = upcomingTasks.reduce((groups, task) => {
                const date = new Date(task.dueDate).toLocaleDateString();
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(task);
                return groups;
            }, {});

            // Sort dates in ascending order
            const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
                new Date(a) - new Date(b)
            );

            upcomingContainer.innerHTML = sortedDates.map(date => `
                <div class="date-group">
                    <h3 class="date-header">${date}</h3>
                    <ul class="task-list">
                        ${groupedTasks[date].map(task => `
                            <li class="task-item" data-id="${task.id}">
                                <div class="task-checkbox">
                                    <i class="fas fa-check"></i>
                                </div>
                                <div class="task-content">
                                    <p class="task-title">${task.title}</p>
                                    <div class="task-meta">
                                        ${task.tags && task.tags.length ? `<span><i class="fas fa-tag"></i> ${task.tags.join(', ')}</span>` : ''}
                                        ${task.description ? `<span><i class="fas fa-info-circle"></i> ${task.description}</span>` : ''}
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');

            // Add event listeners for task interactions
            upcomingContainer.addEventListener('click', (e) => {
                const taskCheckbox = e.target.closest('.task-checkbox');
                if (taskCheckbox) {
                    const taskId = taskCheckbox.closest('.task-item').dataset.id;
                    this.toggleTask(taskId);
                }
            });
        }
    }

    // Helper functions
    adjustDateForTimezone(date) {
        const d = new Date(date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Quick add button
        const quickAddBtn = document.getElementById('quick-add-btn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.openTaskModal());
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal.id === 'task-modal') {
                    this.closeTaskModal();
                } else if (modal.id === 'calendar-modal') {
                    this.closeCalendarModal();
                }
            });
        });

        // Task form submission
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTaskFormSubmit();
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.app-container').classList.toggle('sidebar-collapsed');
            });
        }

        // Task list click handlers
        const tasksList = document.getElementById('today-tasks');
        if (tasksList) {
            tasksList.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (!taskItem) return;

                if (e.target.classList.contains('task-checkbox')) {
                    this.toggleTask(taskItem.dataset.taskId);
                } else if (e.target.classList.contains('delete-task')) {
                    this.deleteTask(taskItem.dataset.taskId);
                }
            });
        }

        // Calendar link
        const calendarLink = document.getElementById('calendar-link');
        if (calendarLink) {
            calendarLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCalendarModal();
            });
        }

        // Calendar navigation
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        if (prevMonthBtn && nextMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
            nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
        }

        // Calendar days click handler
        const calendarDays = document.getElementById('calendar-days');
        if (calendarDays) {
            calendarDays.addEventListener('click', (e) => {
                const dayElement = e.target.closest('.calendar-day');
                if (dayElement && !dayElement.classList.contains('other-month')) {
                    this.selectCalendarDay(dayElement);
                }
            });
        }
    }

    openTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.add('show');
            // Set default date to today
            const dateInput = document.getElementById('task-date');
            if (dateInput) {
                dateInput.valueAsDate = new Date();
            }
        }
    }

    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('show');
            document.getElementById('task-form').reset();
        }
    }

    handleTaskFormSubmit() {
        const titleInput = document.getElementById('task-title');
        const dateInput = document.getElementById('task-date');
        const tagsInput = document.getElementById('task-tags');
        const descriptionInput = document.getElementById('task-description');

        if (!titleInput.value.trim()) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        const task = this.addTask(
            titleInput.value.trim(),
            dateInput.value,
            tagsInput.value,
            descriptionInput.value.trim()
        );

        if (task) {
            this.closeTaskModal();
            this.showNotification('Task created successfully!');
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateDateDisplay() {
        const dateDisplay = document.querySelector('.date-display');
        if (dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date().toLocaleDateString(undefined, options);
        }
    }

    createTaskHTML(task) {
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <label class="checkbox-container">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="task-content">
                    <div class="task-details">
                        <div class="task-title">${task.title}</div>
                        ${task.tags.length > 0 ? `
                            <div class="task-tags">
                                ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    </div>
                </div>
                <button class="delete-task" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `;
    }

    // Update completed tasks display
    updateCompletedTasks() {
        const completedTasks = this.getCompletedTasks();
        const completedContainer = document.getElementById('completed-tasks');
        
        if (completedContainer) {
        if (completedTasks.length === 0) {
                completedContainer.innerHTML = `
                <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        No completed tasks yet
                    </div>
                `;
            return;
        }

        // Group tasks by completion date
            const groupedTasks = completedTasks.reduce((groups, task) => {
                const date = new Date(task.completedAt).toLocaleDateString();
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(task);
            return groups;
        }, {});

            // Sort dates in descending order
            const sortedDates = Object.keys(groupedTasks).sort((a, b) => 
                new Date(b) - new Date(a)
            );

            completedContainer.innerHTML = sortedDates.map(date => `
                <div class="date-group">
                    <h3 class="date-header">${date}</h3>
                    <ul class="task-list">
                        ${groupedTasks[date].map(task => `
                            <li class="task-item completed" data-id="${task.id}">
                                <div class="task-checkbox checked">
                                    <i class="fas fa-check"></i>
                                </div>
                                <div class="task-content">
                                    <p class="task-title">${task.title}</p>
                                    <div class="task-meta">
                                        ${task.dueDate ? `<span><i class="fas fa-clock"></i> Due: ${task.dueDate}</span>` : ''}
                                        ${task.tags && task.tags.length ? `<span><i class="fas fa-tag"></i> ${task.tags.join(', ')}</span>` : ''}
                                        </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('');

            // Add event listener for task toggles
            completedContainer.addEventListener('click', (e) => {
                const taskCheckbox = e.target.closest('.task-checkbox');
                if (taskCheckbox) {
                    const taskId = taskCheckbox.closest('.task-item').dataset.id;
                    this.toggleTask(taskId);
                }
            });
        }
    }

    openCalendarModal() {
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.classList.add('show');
            this.currentDate = new Date();
            this.selectedDate = new Date();
            this.renderCalendar();
        }
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month-year display
        const monthYearElement = document.getElementById('calendar-month-year');
        if (monthYearElement) {
            monthYearElement.textContent = new Date(year, month).toLocaleDateString('default', {
                month: 'long',
                year: 'numeric'
            });
        }

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = firstDay.getDay();

        // Get previous month's days that show in current month view
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // Generate calendar HTML
        const calendarDays = document.getElementById('calendar-days');
        if (!calendarDays) return;

        let daysHTML = '';

        // Previous month's days
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            daysHTML += `<div class="calendar-day other-month">${day}</div>`;
        }

        // Current month's days
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === this.selectedDate.toDateString();
            const hasTasks = this.getTasksForDate(date).length > 0;
            
            daysHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTasks ? 'has-tasks' : ''}"
                     data-date="${date.toISOString().split('T')[0]}">
                    ${day}
                </div>
            `;
        }

        // Next month's days
        const remainingDays = 42 - (startingDay + totalDays); // 42 is 6 rows × 7 days
        for (let day = 1; day <= remainingDays; day++) {
            daysHTML += `<div class="calendar-day other-month">${day}</div>`;
        }

        calendarDays.innerHTML = daysHTML;
        
        // Update tasks for selected date
        this.updateSelectedDateTasks();
    }

    selectCalendarDay(dayElement) {
        // Remove selected class from previously selected day
        const previousSelected = document.querySelector('.calendar-day.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Add selected class to clicked day
        dayElement.classList.add('selected');

        // Update selected date
        this.selectedDate = new Date(dayElement.dataset.date);
        this.updateSelectedDateTasks();
    }

    updateSelectedDateTasks() {
        const selectedDateElement = document.getElementById('selected-date');
        const tasksListElement = document.getElementById('date-tasks-list');
        
        if (!selectedDateElement || !tasksListElement) return;

        // Update selected date display
        selectedDateElement.textContent = this.selectedDate.toLocaleDateString('default', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Get and display tasks for selected date
        const tasks = this.getTasksForDate(this.selectedDate);
        
        if (tasks.length === 0) {
            tasksListElement.innerHTML = `
                <li class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    No tasks scheduled for this date
                </li>
            `;
        } else {
            tasksListElement.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');
        }
    }

    getTasksForDate(date) {
        const dateStr = this.adjustDateForTimezone(date.toISOString().split('T')[0]);
        return this.tasks.filter(task => task.dueDate === dateStr);
    }

    // Add closeCalendarModal method
    closeCalendarModal() {
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
}

// Initialize the task manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});

// Add some additional styles for the new elements
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    /* Current date display */
    .current-date {
        color: #666;
        font-size: 14px;
        margin: 4px 0 12px 0;
    }

    .task-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #f1f1f1;
        cursor: grab;
        user-select: none;
        background: #fff;
        transition: background-color 0.2s ease;
    }

    .task-item.dragging {
        opacity: 0.5;
        cursor: grabbing;
    }

    .task-item.drag-over {
        background-color: #f7f7f7;
        position: relative;
    }

    .task-item.drag-over::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -8px;
        right: -8px;
        height: 2px;
        background-color: #db4c3f;
    }

    .task-drag-handle {
        color: #ccc;
        cursor: grab;
        padding: 4px;
        margin-left: -8px;
    }

    .task-drag-handle:hover {
        color: #808080;
    }

    .dragging .task-drag-handle {
        cursor: grabbing;
    }

    .task-checkbox {
        cursor: pointer;
        color: #808080;
        transition: color 0.2s ease;
    }

    .task-checkbox:hover {
        color: #db4c3f;
    }

    .task-title {
        flex: 1;
    }

    .task-date {
        font-size: 12px;
        color: #808080;
    }

    .delete-task {
        background: none;
        border: none;
        color: #808080;
        cursor: pointer;
        padding: 4px;
        opacity: 0;
        transition: all 0.2s ease;
    }

    .task-item:hover .delete-task {
        opacity: 1;
    }

    .delete-task:hover {
        color: #db4c3f;
    }

    .activity-item {
        font-size: 13px;
        color: #404040;
    }

    .activity-item small {
        color: #808080;
        margin-left: 8px;
    }

    .activity-item i {
        font-size: 8px;
        color: #db4c3f;
    }

    .date-group {
        margin-bottom: 24px;
    }

    .date-header {
        color: #666;
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 8px 0;
        padding-left: 4px;
    }

    .task-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .upcoming-grid {
        max-width: 800px;
        margin: 0 auto;
    }

    .empty-state {
        text-align: center;
        color: #808080;
        font-size: 14px;
        padding: 24px 0;
    }

    .empty-state i {
        display: block;
        font-size: 24px;
        margin-bottom: 8px;
        color: #db4c3f;
    }

    .task-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .task-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .task-tag {
        font-size: 11px;
        color: #666;
        background: #f1f1f1;
        padding: 2px 8px;
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .task-tag:hover {
        background: #e4e4e4;
        color: #db4c3f;
    }

    .task-tag i {
        font-size: 10px;
    }

    #task-tags {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
        transition: all 0.2s ease;
    }

    #task-tags:focus {
        border-color: #db4c3f;
        box-shadow: 0 0 0 2px rgba(219, 76, 63, 0.2);
        outline: none;
    }

    /* Tag Filter Styles */
    .tags-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .tags-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        padding: 8px;
    }

    .tag-filter-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid #e4e4e4;
        border-radius: 6px;
        background: #fff;
        color: #666;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
    }

    .tag-filter-btn:hover {
        border-color: #db4c3f;
        color: #db4c3f;
    }

    .tag-filter-btn.active {
        background: #db4c3f;
        color: #fff;
        border-color: #db4c3f;
    }

    .tag-count {
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        margin-left: auto;
    }

    .tag-filter-btn.active .tag-count {
        background: rgba(255, 255, 255, 0.2);
    }

    .filtered-tasks-header {
        color: #666;
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 16px 0;
        padding: 0 8px;
    }

    .task-tag.highlighted {
        background: #db4c3f;
        color: #fff;
    }

    .task-tag.highlighted:hover {
        background: #c53727;
        color: #fff;
    }

    #tagged-tasks .task-item {
        margin: 0 8px;
        padding: 12px 0;
    }

    #tagged-tasks .task-date {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #808080;
        margin-top: 4px;
    }

    #tagged-tasks .task-date i {
        font-size: 11px;
    }

    /* Empty state adjustments */
    #tag-list .empty-state,
    #tagged-tasks .empty-state {
        padding: 32px 16px;
        background: #f9f9f9;
        border-radius: 8px;
        margin: 8px;
    }

    /* Completed tasks styles */
    .task-item.completed {
        opacity: 0.8;
    }

    .task-item.completed .task-title {
        text-decoration: line-through;
        color: #808080;
    }

    .task-item.completed .task-checkbox {
        color: #db4c3f;
    }

    .task-item.completed .task-tag {
        opacity: 0.7;
    }

    .task-item.completed .task-date {
        text-decoration: line-through;
    }

    #completed-tasks .date-group {
        margin-bottom: 32px;
    }

    #completed-tasks .date-header {
        color: #666;
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 12px 0;
        padding: 0 8px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    #completed-tasks .date-header::before {
        content: '';
        flex: 1;
        height: 1px;
        background: #e4e4e4;
    }

    #completed-tasks .task-item {
        transition: opacity 0.3s ease;
    }

    #completed-tasks .task-item:hover {
        opacity: 1;
    }

    #completed-tasks .empty-state {
        padding: 48px 16px;
        background: #f9f9f9;
        border-radius: 8px;
        margin: 16px 8px;
    }

    #completed-tasks .empty-state i {
        font-size: 32px;
        margin-bottom: 16px;
    }
`;
document.head.appendChild(additionalStyles);
