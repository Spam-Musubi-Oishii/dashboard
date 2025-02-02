// Store classes and their students
let classes = JSON.parse(localStorage.getItem('classes')) || {};
let currentClass = localStorage.getItem('currentClass') || "";
let stats = JSON.parse(localStorage.getItem('studentPickerStats')) || {};
let currentTeams = JSON.parse(localStorage.getItem('currentTeams')) || [];
let savedTeamSets = JSON.parse(localStorage.getItem('savedTeamSets')) || {};
let isSpinning = false;
let currentSelectedStudent = null;
let currentSelectedTeam = null;
let classMilestones = JSON.parse(localStorage.getItem('classMilestones')) || {};
let preselectedStudent = null;
  
// Change these from const to let at the top of your file
let STUDENT_SPIN_DURATION = 3000; // Default 3 seconds
let TEAM_SPIN_DURATION = 3000;    // Default 3 seconds
  
// Add these with your other global variables
let settings = {
    fireworksEnabled: true,
    showTeamsTab: true,
    showLeaderboardTab: true,
    showMilestonesTab: true,
    showStatsTab: true
};
  
// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  updateClassSelect();
  setupEventListeners();
  loadStats();
  updateProgressTracker();
  updateContentVisibility();
  updateTabVisibility();
  // Replace wheel click listener with student selector
  document
    .getElementById("selectButton")
    .addEventListener("click", selectStudent);
  initializeSettings();
});
  
function setupEventListeners() {
    // Class selection
    document.getElementById('classSelect').addEventListener('change', handleClassSelect);
    
    // New class modal
    document.getElementById('saveClass').addEventListener('click', saveNewClass);
    
    
    // File handling
    const fileDropZone = document.getElementById('fileDropZone');
    const csvFileInput = document.getElementById('csvFile');
    
    fileDropZone.addEventListener('click', () => csvFileInput.click());
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.style.borderColor = '#666';
    });
    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.style.borderColor = '#ccc';
    });
    fileDropZone.addEventListener('drop', handleFileDrop);
    csvFileInput.addEventListener('change', handleFileSelect);

    // Teams
    document.getElementById('generateTeams').addEventListener('click', generateTeams);
    document.getElementById('selectTeamButton').addEventListener('click', selectTeam);
    document.getElementById('confirmTeams').addEventListener('click', confirmTeams);
    document.getElementById('savedTeamSetsSelect').addEventListener('change', loadSavedTeamSet);

    // Add tab change listener to update classes tab
    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', (e) => {
        if (e.target.getAttribute('href') === '#classes') {
          updateClassesTab();
        }
      });
    });

     // Add milestone button listener
     const addMilestoneBtn = document.getElementById('addMilestoneBtn');
     if (addMilestoneBtn) {
         addMilestoneBtn.addEventListener('click', addMilestone);
     }

    // Add class point button listener
    const addClassPointBtn = document.getElementById('addClassPoint');
    if (addClassPointBtn) {
        addClassPointBtn.addEventListener('click', addClassPoint);
    }
}

function loadStats() {
    try {
        if (localStorage.getItem("classes")) {
            classes = JSON.parse(localStorage.getItem("classes"));
            
            // Convert any old format data to new format
            Object.keys(classes).forEach(className => {
                if (classes[className].length > 0 && typeof classes[className][0] === 'string') {
                    classes[className] = classes[className].map(name => ({
                        name: name,
                        points: 0,
                        teams: {}
                    }));
                }
            });
        } else {
            // Initialize with empty classes object
            classes = {};
        }
        
        if (localStorage.getItem("currentClass")) {
            currentClass = localStorage.getItem("currentClass");
        }
        
        if (localStorage.getItem("studentPickerStats")) {
            stats = JSON.parse(localStorage.getItem("studentPickerStats"));
        }
        
        if (localStorage.getItem("currentTeams")) {
            currentTeams = JSON.parse(localStorage.getItem("currentTeams"));
            updateTeamSelector();
        }
        
        if (localStorage.getItem("savedTeamSets")) {
            savedTeamSets = JSON.parse(localStorage.getItem("savedTeamSets"));
        }
        
        if (localStorage.getItem("classMilestones")) {
            classMilestones = JSON.parse(localStorage.getItem("classMilestones"));
        }
        
        updateSavedTeamSetsSelect();
        
        // Update the today's selections count display
        updateTodaySelectionsCount();
    } catch (e) {
        // Reset to empty state if there's an error
        classes = {};
        currentClass = "";
    }
}

function saveStats() {
    localStorage.setItem("studentPickerStats", JSON.stringify(stats));
    localStorage.setItem("currentClass", currentClass);
    localStorage.setItem("currentTeams", JSON.stringify(currentTeams));
    localStorage.setItem("classes", JSON.stringify(classes));
    localStorage.setItem("savedTeamSets", JSON.stringify(savedTeamSets));
    localStorage.setItem("classMilestones", JSON.stringify(classMilestones));
}

function updateClassSelect() {
  const select = document.getElementById("classSelect");
  select.innerHTML = '<option value="">Select Class</option>';
  Object.keys(classes).forEach((className) => {
    const option = document.createElement("option");
    option.value = className;
    option.textContent = className;
    select.appendChild(option);
  });
  select.innerHTML += '<option value="new">+ Add New Class</option>';
}

function handleClassSelect(e) {
    if (e.target.value === "new") {
        const modal = new bootstrap.Modal(document.getElementById("newClassModal"));
        modal.show();
        e.target.value = currentClass;
    } else {
        currentClass = e.target.value;
        
        // Update class borders immediately
        const allClassDivs = document.querySelectorAll('.class-item');
        allClassDivs.forEach(div => {
            const className = div.querySelector('h5').textContent;
            if (className === currentClass) {
                div.classList.add('border-success');
            } else {
                div.classList.remove('border-success');
            }
        });
        
        currentSelectedStudent = null;  // Reset selected student
        currentSelectedTeam = null;     // Reset selected team
        
        // Remove points buttons
        const addPointsBtn = document.getElementById("addPointsButton");
        if (addPointsBtn) addPointsBtn.remove();
        const addTeamPointsBtn = document.getElementById("addTeamPointsButton");
        if (addTeamPointsBtn) addTeamPointsBtn.remove();
        
        currentTeams = [];
        
        // Clear team displays
        const teamsList = document.getElementById("teamsList");
        if (teamsList) {
            teamsList.innerHTML = "";
        }
        
        // Clear team set name input
        const teamSetNameInput = document.getElementById('teamSetName');
        if (teamSetNameInput) {
            teamSetNameInput.value = "";
        }
        
        // Reset saved teams select
        updateSavedTeamSetsSelect();
        
        // Clean up selection buttons
        cleanupSelectionButtons();
        
        // Update both content and tab visibility
        updateContentVisibility();
        updateTabVisibility();
        
        // Only update content if a class is selected
        if (currentClass) {
            updateStudentSelector();
            updateTeamSelector();
            updateLeaderboard();
            updateStats();
            updateStudentsTab();
            updateClassesTab();
            updateMilestonesTab();
            updateProgressTracker();
        }
        
        saveStats();
        
        // Update the today's selections count for the new class
        updateTodaySelectionsCount();

        // Show/hide class point button based on class selection
        const addClassPointBtn = document.getElementById('addClassPoint');
        if (addClassPointBtn) {
            addClassPointBtn.style.display = currentClass ? 'block' : 'none';
        }
    }
}

function deduplicateNames(names) {
    const nameCount = {};
    const uniqueNames = [];
    
    // First pass: count occurrences of each name
    names.forEach(name => {
        const trimmedName = name.trim();
        nameCount[trimmedName] = (nameCount[trimmedName] || 0) + 1;
    });
    
    // Second pass: add numbers to duplicates
    const usedNames = {};
    names.forEach(name => {
        const trimmedName = name.trim();
        if (nameCount[trimmedName] > 1) {
            // If this name appears multiple times
            usedNames[trimmedName] = (usedNames[trimmedName] || 0) + 1;
            uniqueNames.push(`${trimmedName} (${usedNames[trimmedName]})`);
        } else {
            // If this name appears only once
            uniqueNames.push(trimmedName);
        }
    });
    
    return uniqueNames;
}

function saveNewClass() {
    const className = document.getElementById("newClassName").value.trim();
    const studentNames = document
        .getElementById("studentNames")
        .value.split("\n")
        .map((name) => name.trim())
        .filter((name) => name);

    if (className && studentNames.length > 0) {
        // Deduplicate names before creating student objects
        const uniqueNames = deduplicateNames(studentNames);
        
        // Convert simple names to student objects and add CLASS student
        classes[className] = [
            {
                name: "CLASS",
                points: 0,
                teams: {},
                isClassStudent: true // Add this flag to identify the CLASS student
            },
            ...uniqueNames.map(name => ({
                name: name,
                points: 0,
                teams: {}
            }))
        ];
        
        currentClass = className;
        updateClassSelect();
        document.getElementById("classSelect").value = className;
        updateStudentSelector();
        saveStats();
        
        bootstrap.Modal.getInstance(
            document.getElementById("newClassModal")
        ).hide();

        // Clear form
        document.getElementById("newClassName").value = "";
        document.getElementById("studentNames").value = "";
        updateClassesTab();
    }
}

function handleFileDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    processCSVFile(file);
  }
  e.target.style.borderColor = "#ccc";
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processCSVFile(file);
  }
}

function processCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const students = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line);
            
        // Deduplicate names before displaying
        const uniqueNames = deduplicateNames(students);
        document.getElementById("studentNames").value = uniqueNames.join("\n");
    };
    reader.readAsText(file);
}

function updateStudentSelector() {
    const selectorContainer = document.getElementById("studentSelector");
    
    // Create the selector window without duplicating the select button
    selectorContainer.innerHTML = `
        <div class="selection-marker"></div>
        <div class="selector-window"></div>
    `;

    if (!currentClass || !classes[currentClass]) return;

    const selectorWindow = selectorContainer.querySelector('.selector-window');
    
    // Filter out CLASS student
    const selectableStudents = classes[currentClass].filter(student => !student.isClassStudent);
    
    // Create at least 5 items for smooth rotation
    const minItems = 5;
    const repeats = Math.ceil(minItems / selectableStudents.length);
    const repeatedStudents = Array(repeats).fill(selectableStudents).flat();

    repeatedStudents.forEach((student) => {
        const div = document.createElement("div");
        div.className = "student-item";
        div.textContent = student.name;
        selectorWindow.appendChild(div);
    });

    updateVisibleItems(0);
}

function updateVisibleItems(startIndex) {
    const items = Array.from(document.querySelectorAll('.student-item'));
    const totalItems = items.length;
    
    if (totalItems === 0) return;

    // Reset all items
    items.forEach(item => {
        item.className = 'student-item';
    });

    // Ensure startIndex is within bounds
    startIndex = ((startIndex % totalItems) + totalItems) % totalItems;

    // Show all 5 positions
    const positions = [
        { index: ((startIndex - 2 + totalItems) % totalItems), class: 'position-far' },
        { index: ((startIndex - 1 + totalItems) % totalItems), class: 'position-near' },
        { index: startIndex, class: 'position-center' },
        { index: ((startIndex + 1) % totalItems), class: 'position-near-top' },
        { index: ((startIndex + 2) % totalItems), class: 'position-far-top' }
    ];

    positions.forEach(pos => {
        if (items[pos.index]) {
            items[pos.index].classList.add('visible-item', pos.class);
        }
    });
}

function selectStudent() {
    if (isSpinning || !currentClass || !classes[currentClass].length) return;

    const selectableStudents = classes[currentClass].filter(s => !s.isClassStudent);
    if (selectableStudents.length === 0) return;

    isSpinning = true;
    let selectedIndex;
    let selectedStudent;

    if (preselectedStudent) {
        selectedIndex = selectableStudents.findIndex(s => s.name === preselectedStudent);
        if (selectedIndex === -1) {
            selectedIndex = Math.floor(Math.random() * selectableStudents.length);
        }
        selectedStudent = selectableStudents[selectedIndex];
        preselectedStudent = null;
        updateStudentsTab();
    } else {
        selectedIndex = Math.floor(Math.random() * selectableStudents.length);
        selectedStudent = selectableStudents[selectedIndex];
    }

    const startTime = Date.now();
    const totalDuration = STUDENT_SPIN_DURATION;
    
    // Calculate starting position
    const totalSpins = Math.floor(totalDuration / 100);
    const startingIndex = (selectedIndex - totalSpins + selectableStudents.length * Math.ceil(totalSpins / selectableStudents.length)) % selectableStudents.length;
    let currentIndex = startingIndex;
    
    function spinList() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / totalDuration, 1);
        
        currentIndex = (currentIndex + 1) % selectableStudents.length;
        updateVisibleItems(currentIndex);
        
        let nextDelay;
        if (progress < 0.3) {
            nextDelay = 30 + (progress * 66.67);
        } else if (progress < 0.7) {
            nextDelay = 50 + ((progress - 0.3) * 375);
        } else {
            nextDelay = 200 + ((progress - 0.7) * 666.67);
        }
        
        if (progress < 1 && currentIndex !== selectedIndex) {
            setTimeout(spinList, nextDelay);
        } else {
            finishSelection(selectedStudent);
        }
    }
    
    spinList();
}

function showPointsToast(recipients) {
    // Create toast element with consistent styling
    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white bg-success border-0';
    
    // Format the recipients message
    const message = Array.isArray(recipients) 
        ? `Added 1 point to team members: ${recipients.join(', ')}`
        : `Added 1 point to ${recipients}`;
    
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Ensure toast container exists
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Add toast to container and show it
    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    // Remove toast element after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

function finishSelection(selectedStudent) {
    isSpinning = false;
    currentSelectedStudent = selectedStudent;
    
    // Update stats
    if (!stats[currentClass]) stats[currentClass] = {};
    if (!stats[currentClass][selectedStudent.name]) {
        stats[currentClass][selectedStudent.name] = { count: 0, selections: [] };
    }
    stats[currentClass][selectedStudent.name].count++;
    stats[currentClass][selectedStudent.name].selections.push(new Date().toISOString());
    
    // Update the today's selections count
    updateTodaySelectionsCount();
    
    // Add points button if it doesn't exist
    const selectButtonContainer = document.getElementById("selectButton").parentElement;
    selectButtonContainer.className = "d-flex align-items-center gap-2";
    
    if (!document.getElementById("addPointsButton")) {
        const addPointsBtn = document.createElement("button");
        addPointsBtn.id = "addPointsButton";
        addPointsBtn.className = "btn btn-outline-success";
        addPointsBtn.innerHTML = "+";
        
        addPointsBtn.addEventListener('click', function() {
            if (!currentSelectedStudent) return;
            
            // Get total points before adding new point
            const previousPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
            
            // Find the student in the current class and update points
            const student = classes[currentClass].find(s => s.name === currentSelectedStudent.name);
            if (student) {
                student.points++;
                
                // Get new total points
                const currentPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
                
                // Check for milestone
                checkAndCelebrateMilestone(previousPoints, currentPoints);
                
                // Show toast notification
                showPointsToast(student.name);
                
                // Update everything
                saveStats();
                updateStats();
                updateStudentsTab();
                updateLeaderboard();
                updateProgressTracker();
            }
        });
        
        selectButtonContainer.appendChild(addPointsBtn);
    }
    
    // Launch fireworks
    launchFireworks(selectButtonContainer);
    
    saveStats();
    updateStats();
    updateProgressTracker();
}

function generateTeams() {
    const teamSetName = document.getElementById('teamSetName').value.trim();
    if (!teamSetName) {
        alert('Please enter a team set name');
        return;
    }
    
    // Check if team set name already exists for current class
    if (savedTeamSets[currentClass]?.[teamSetName]) {
        alert(`A team set named "${teamSetName}" already exists for this class. Please use a different name.`);
        return;
    }
    
    if (!currentClass || !classes[currentClass]) return;

    const numTeams = parseInt(document.getElementById("numTeams").value);
    // Filter out CLASS student when creating teams
    const students = [...classes[currentClass]].filter(student => !student.isClassStudent);
    currentTeams = Array.from({ length: numTeams }, () => []);

    // Shuffle students
    for (let i = students.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [students[i], students[j]] = [students[j], students[i]];
    }

    // Distribute students
    students.forEach((student, index) => {
        currentTeams[index % numTeams].push(student.name);
    });

    // Update display
    displayTeams();
    updateTeamHeader();
}

function displayTeams(teamSetName = '') {
    const teamsList = document.getElementById("teamsList");
    if (!teamsList) return;

    teamsList.innerHTML = "";

    // Add header to show current team set name
    const headerDiv = document.createElement("div");
    headerDiv.className = "team-set-header mb-4 text-center";
    headerDiv.innerHTML = teamSetName ? `<h3>${teamSetName} Teams</h3>` : '<h3>Teams</h3>';
    teamsList.appendChild(headerDiv);

    // Create row container for the grid
    const rowDiv = document.createElement("div");
    rowDiv.className = "row g-4"; // g-4 adds gutters between cards
    teamsList.appendChild(rowDiv);

    // Display teams in a grid
    currentTeams.forEach((team, index) => {
        const colDiv = document.createElement("div");
        colDiv.className = "col-md-4"; // Creates 3 columns per row on medium and larger screens
        
        const teamDiv = document.createElement("div");
        teamDiv.className = "card h-100 shadow-sm"; // h-100 makes all cards in row same height
        teamDiv.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Team ${index + 1}</h5>
            </div>
            <div class="card-body">
                <ul class="list-group list-group-flush">
                    ${team.map(studentName => `
                        <li class="list-group-item border-0 px-0">${studentName}</li>
                    `).join("")}
                </ul>
            </div>
        `;
        
        colDiv.appendChild(teamDiv);
        rowDiv.appendChild(colDiv);
    });
}

function confirmTeams() {
    const teamSetName = document.getElementById('teamSetName').value.trim();
    if (!teamSetName || !currentClass || !currentTeams.length) {
        alert('Please generate teams first and ensure you have a team set name');
        return;
    }

    // Save team set
    if (!savedTeamSets[currentClass]) {
        savedTeamSets[currentClass] = {};
    }
    
    savedTeamSets[currentClass][teamSetName] = {
        date: new Date().toISOString(),
        teams: currentTeams
    };

    // Update student records with team assignments
    classes[currentClass].forEach(student => {
        currentTeams.forEach((team, teamIndex) => {
            if (team.includes(student.name)) {
                if (!student.teams) student.teams = {};
                student.teams[teamSetName] = teamIndex + 1;
            }
        });
    });

    // Save everything to localStorage
    saveStats();
    
    // Update both dropdowns and select the new team set
    updateSavedTeamSetsSelect();
    
    // Select the new team set in the Teams tab dropdown
    const teamsTabDropdown = document.getElementById('savedTeamSetsSelect');
    if (teamsTabDropdown) {
        teamsTabDropdown.value = teamSetName;
    }
    
    // Select the new team set in the Team Picker tab dropdown and update display
    const teamPickerDropdown = document.getElementById('savedTeamSets');
    if (teamPickerDropdown) {
        teamPickerDropdown.value = teamSetName;
        updateTeamSelector();
    }
    
    // Clear the team set name input
    document.getElementById('teamSetName').value = '';
    
    alert(`Teams "${teamSetName}" saved successfully!`);
}

function loadSavedTeamSet(e) {
    const teamSetName = e.target.value;
    if (!teamSetName || !currentClass || !savedTeamSets[currentClass]?.[teamSetName]) return;

    currentTeams = savedTeamSets[currentClass][teamSetName].teams;
    
    const numTeamsInput = document.getElementById('numTeams');
    if (numTeamsInput) {
        numTeamsInput.value = currentTeams.length;
    }
    
    // Call displayTeams with the team set name
    displayTeams(teamSetName);
    updateTeamSelector();
}

function updateSavedTeamSetsSelect() {
    const select = document.getElementById('savedTeamSetsSelect');
    const container = select.parentElement;
    
    // Clear existing buttons first
    const existingButtons = container.querySelectorAll('.team-action-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Create a flex container for the dropdown and buttons
    const flexContainer = document.createElement('div');
    flexContainer.className = 'd-flex gap-2';
    
    // Move the select into the flex container
    select.parentNode.insertBefore(flexContainer, select);
    flexContainer.appendChild(select);
    
    // Reset the select
    select.innerHTML = '<option value="">Load Saved Team Set</option>';
    select.className = 'form-select'; // Ensure proper styling
    
    if (currentClass && savedTeamSets[currentClass]) {
        Object.keys(savedTeamSets[currentClass]).forEach(teamSetName => {
            const option = document.createElement('option');
            option.value = teamSetName;
            option.textContent = teamSetName;
            select.appendChild(option);
        });

        // Add Edit and Remove buttons
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary team-action-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = editSelectedTeamSet;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger team-action-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = removeSelectedTeamSet;

        flexContainer.appendChild(editBtn);
        flexContainer.appendChild(removeBtn);
    }
}

function removeSelectedTeamSet() {
    const select = document.getElementById('savedTeamSetsSelect');
    const teamSetName = select.value;
    
    if (!teamSetName) {
        alert('Please select a team set first');
        return;
    }

    if (confirm(`Are you sure you want to delete the team set "${teamSetName}"? This action cannot be undone.`)) {
        delete savedTeamSets[currentClass][teamSetName];
        
        // Remove team assignments from students
        classes[currentClass].forEach(student => {
            if (student.teams && student.teams[teamSetName]) {
                delete student.teams[teamSetName];
            }
        });

        saveStats();
        updateSavedTeamSetsSelect();
        displayTeams(); // Clear the display
    }
}

function editSelectedTeamSet() {
    const select = document.getElementById('savedTeamSetsSelect');
    const teamSetName = select.value;
    
    if (!teamSetName) {
        alert('Please select a team set first');
        return;
    }

    const teams = savedTeamSets[currentClass][teamSetName].teams;
    
    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'mt-3';
    editForm.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Edit Teams: ${teamSetName}</h5>
            </div>
            <div class="card-body">
                ${teams.map((team, index) => `
                    <div class="mb-3">
                        <label class="form-label">Team ${index + 1}</label>
                        <textarea class="form-control team-edit-area" 
                                data-team-index="${index}"
                                rows="3">${team.join('\n')}</textarea>
                    </div>
                `).join('')}
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-secondary" onclick="this.closest('.card').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveTeamEdits('${teamSetName}')">Save Changes</button>
                </div>
            </div>
        </div>
    `;

    // Find a good place to insert the form
    const teamsList = document.getElementById('teamsList');
    if (teamsList) {
        teamsList.insertBefore(editForm, teamsList.firstChild);
    }
}

function saveTeamEdits(teamSetName) {
    // Get all textareas before any DOM manipulation
    const editAreas = document.querySelectorAll('.team-edit-area');
    const newTeams = Array.from(editAreas).map(textarea => 
        textarea.value.split('\n')
            .map(name => name.trim())
            .filter(name => name)
    );

    // Update the teams
    savedTeamSets[currentClass][teamSetName].teams = newTeams;
    
    // Update student records
    classes[currentClass].forEach(student => {
        if (student.teams) {
            delete student.teams[teamSetName];
        }
    });

    newTeams.forEach((team, teamIndex) => {
        team.forEach(studentName => {
            const student = classes[currentClass].find(s => s.name === studentName);
            if (student) {
                if (!student.teams) student.teams = {};
                student.teams[teamSetName] = teamIndex + 1;
            }
        });
    });

    saveStats();
    updateSavedTeamSetsSelect();
    displayTeams();
    
    // Find and remove the edit form card
    const editCard = document.querySelector('.card:has(.team-edit-area)');
    if (editCard) {
        editCard.remove();
    }
}

function updateLeaderboard() {
    const leaderboardDiv = document.getElementById("leaderboard");
    if (!leaderboardDiv || !currentClass || !classes[currentClass]) {
        return;
    }

    // Sort students by points in descending order, excluding CLASS student
    const sortedStudents = [...classes[currentClass]]
        .filter(student => !student.isClassStudent)
        .sort((a, b) => b.points - a.points);
    
    // Create leaderboard HTML
    let html = `
        <div class="leaderboard-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Student</th>
                        <th>Points</th>
                        <th style="width: 50%">Progress</th>
                    </tr>
                </thead>
                <tbody>
    `;

    sortedStudents.forEach((student, index) => {
        const percentage = (student.points / 50) * 100; // Scale to max 50 points
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>${student.points}</td>
                <td>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" 
                            style="width: ${percentage}%;" 
                            aria-valuenow="${student.points}" 
                            aria-valuemin="0" 
                            aria-valuemax="50">
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    leaderboardDiv.innerHTML = html;
}

function updateStats() {
    const statsDiv = document.getElementById("stats");
    if (!statsDiv || !currentClass) return;

    // Calculate selections made today
    const selectionDate = new Date();
    selectionDate.setHours(0, 0, 0, 0);
    
    let todaySelections = 0;
    Object.values(stats[currentClass]).forEach(studentStats => {
        if (studentStats.selections) {
            todaySelections += studentStats.selections.filter(date => {
                const selectionDate = new Date(date);
                selectionDate.setHours(0, 0, 0, 0);
                return selectionDate.getTime() === selectionDate.getTime();
            }).length;
        }
    });

    // Calculate total selections
    const totalSelections = Object.values(stats[currentClass]).reduce((sum, student) => sum + (student.count || 0), 0);

    // Create the initial stats cards
    let html = `
        <div class="container mt-4">
            <div class="row">
                <div class="col">
                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Total Selections</h5>
                        </div>
                        <div class="card-body">
                            <h2 class="card-title">${totalSelections}</h2>
                            <p class="card-text">total student and team selections</p>
                        </div>
                    </div>

                    <div class="card shadow-sm border-0 mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Daily Selections</h5>
                        </div>
                        <div class="card-body">
                            <h2 class="card-title"></h2>
                                <div id="calendarContainer" class="mt-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Set the initial HTML
    statsDiv.innerHTML = html;

    // Now add the calendar to the container
    const calendarContainer = document.getElementById('calendarContainer');
    
    // Add calendar section
    const calendarSection = document.createElement('div');
    calendarSection.className = 'mt-4';

    // Get all dates with selections
    const selectionDates = new Map(); // Will store date -> number of selections

    // Count selections per day
    if (stats[currentClass]) {
        Object.values(stats[currentClass]).forEach(studentStats => {
            if (studentStats.selections) {
                studentStats.selections.forEach(date => {
                    const dayKey = new Date(date).toLocaleDateString();
                    selectionDates.set(dayKey, (selectionDates.get(dayKey) || 0) + 1);
                });
            }
        });
    }

    // Create calendar grid
    const calendar = document.createElement('div');
    calendar.className = 'calendar-grid mt-3';
    calendar.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        max-width: 1000px;
        margin: 0 auto;
    `;

    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'text-center fw-bold';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Get date range (last 35 days) 
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 34); // Show last 5 weeks

    // Fill in calendar cells
    let calendarDate = new Date(startDate);  // Changed from currentDate to calendarDate
    while (calendarDate <= currentDate) {     // Updated comparison variable
        const dayKey = calendarDate.toLocaleDateString();
        const selections = selectionDates.get(dayKey) || 0;

        const cell = document.createElement('div');
        cell.className = 'calendar-cell border rounded p-2';
        cell.style.cssText = `
            min-height: 80px;
            background-color: ${getActivityColor(selections)};
        `;

        cell.innerHTML = `
            <div class="text-end small">${calendarDate.getDate()}</div>
            ${selections ? `
                <div class="small mt-1">
                    <div>🎯 ${selections}</div>
                </div>
            ` : ''}
        `;

        calendar.appendChild(cell);
        
        calendarDate.setDate(calendarDate.getDate() + 1);  // Updated increment variable
    }

    calendarSection.appendChild(calendar);
    calendarContainer.appendChild(calendarSection);
}

function getActivityColor(selections) {
    if (!selections) return '#ffffff';
    
    // Calculate intensity based on number of selections
    const intensity = Math.min(selections / 5, 1);
    
    // Use a light blue color with varying opacity
    return `rgba(200, 230, 255, ${intensity})`;
}

function updateTeamSelector() {
    // First, find or create the controls container that's above the selector
    const controlsContainer = document.querySelector('#teamPicker .d-flex.align-items-center.gap-2');
    
    // Create/update the dropdown if it doesn't exist
    let teamSetsSelect = document.getElementById('savedTeamSets');
    if (!teamSetsSelect) {
        teamSetsSelect = document.createElement('select');
        teamSetsSelect.id = 'savedTeamSets';
        teamSetsSelect.className = 'form-select';
        teamSetsSelect.style.width = 'auto';
        
        // Add the dropdown before the Select Team button
        const selectTeamButton = document.getElementById('selectTeamButton');
        controlsContainer.insertBefore(teamSetsSelect, selectTeamButton);
        
        teamSetsSelect.addEventListener('change', (e) => {
            if (e.target.value && currentClass && savedTeamSets[currentClass]?.[e.target.value]) {
                currentTeams = savedTeamSets[currentClass][e.target.value].teams;
                updateTeamSelector();
                saveStats();
            }
        });
    }
    
    // Update the saved teams dropdown
    teamSetsSelect.innerHTML = '<option value="">Load Saved Teams...</option>';
    if (currentClass && savedTeamSets[currentClass]) {
        Object.keys(savedTeamSets[currentClass]).forEach(teamSetName => {
            const option = document.createElement('option');
            option.value = teamSetName;
            option.textContent = teamSetName;
            if (currentTeams.length && 
                JSON.stringify(currentTeams) === JSON.stringify(savedTeamSets[currentClass][teamSetName].teams)) {
                option.selected = true;
            }
            teamSetsSelect.appendChild(option);
        });
    }

    // Update the selector window
    const selectorContainer = document.getElementById("teamSelector");
    if (!selectorContainer) return;

    // Clear the selector container
    selectorContainer.innerHTML = '';

    // Only create selector content if we're on the team picker tab
    if (document.getElementById('teamPicker').classList.contains('active')) {
        selectorContainer.innerHTML = `
            <div class="selection-marker"></div>
            <div class="selector-window"></div>
        `;

        if (!currentTeams.length) return;

        const selectorWindow = selectorContainer.querySelector('.selector-window');
        
        // Create repeated array of teams until we have at least 5
        let repeatedTeams = [];
        while (repeatedTeams.length < 5) {
            repeatedTeams = repeatedTeams.concat(currentTeams);
        }

        repeatedTeams.forEach((team, index) => {
            const div = document.createElement("div");
            div.className = "team-item";
            div.innerHTML = `
                <strong>Team ${(index % currentTeams.length) + 1}</strong>
                <div class="team-members">${team.join(", ")}</div>
            `;
            selectorWindow.appendChild(div);
        });

        updateVisibleTeams(0);
    }
}

// Update the tab change handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tabs
    const tabs = document.querySelectorAll('a[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1); // Remove the #
            
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Show the target tab pane
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }
            
            // Update content based on which tab was clicked
            switch (targetId) {
                case 'picker':
                    updateStudentSelector();
                    break;
                case 'teamPicker':
                    const teamSetsSelect = document.getElementById('savedTeamSetsSelect');
                    if (teamSetsSelect?.value && currentClass && savedTeamSets[currentClass]?.[teamSetsSelect.value]) {
                        currentTeams = savedTeamSets[currentClass][teamSetsSelect.value].teams;
                    }
                    updateTeamSelector();
                    break;
                case 'stats':
                    updateStats();
                    break;
                case 'students':
                    updateStudentsTab();
                    break;
                case 'classes':
                    updateClassesTab();
                    break;
                case 'milestones':
                    updateMilestonesTab();
                    break;
                case 'teams':
                    displayTeams();
                    break;
                case 'leaderboard':
                    updateLeaderboard();
                    break;
                case 'settings':
                    // Any settings-specific updates can go here
                    break;
            }
            
            // Update nav tabs active state
            tabs.forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Show initial tab
    const initialTab = document.querySelector('.nav-link.active');
    if (initialTab) {
        initialTab.click();
    }
});

function selectTeam() {
    if (isSpinning || !currentTeams.length) return;

    isSpinning = true;
    let selectedIndex;
    
    if (preselectedStudent) {
        selectedIndex = currentTeams.findIndex(team => team.includes(preselectedStudent));
        if (selectedIndex === -1) {
            selectedIndex = Math.floor(Math.random() * currentTeams.length);
        } else {
            preselectedStudent = null;
            updateStudentsTab();
        }
    } else {
        selectedIndex = Math.floor(Math.random() * currentTeams.length);
    }
    
    const selectedTeam = currentTeams[selectedIndex];
    const startTime = Date.now();
    const totalDuration = TEAM_SPIN_DURATION;
    
    // Calculate starting position
    const totalSpins = Math.floor(totalDuration / 100);
    const startingIndex = (selectedIndex - totalSpins + currentTeams.length * Math.ceil(totalSpins / currentTeams.length)) % currentTeams.length;
    let currentIndex = startingIndex;
    
    function spinList() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / totalDuration, 1);
        
        currentIndex = (currentIndex + 1) % currentTeams.length;
        updateVisibleTeams(currentIndex);
        
        let nextDelay;
        if (progress < 0.3) {
            // Start very fast (30-50ms)
            nextDelay = 30 + (progress * 66.67); // Gradually increase from 30ms to 50ms
        } else if (progress < 0.7) {
            // Medium speed (50-200ms)
            nextDelay = 50 + ((progress - 0.3) * 375); // Gradually increase from 50ms to 200ms
        } else {
            // Final approach (200-400ms)
            nextDelay = 200 + ((progress - 0.7) * 666.67); // Gradually increase from 200ms to 400ms
        }
        
        if (progress < 1 && currentIndex !== selectedIndex) {
            setTimeout(spinList, nextDelay);
        } else {
            finishTeamSelection(selectedTeam, selectedIndex);
        }
    }
    
    spinList();
}

function finishTeamSelection(selectedTeam, teamIndex) {
    isSpinning = false;
    currentSelectedTeam = selectedTeam;
    
    // Update the select button container to include the points button
    const selectButtonContainer = document.getElementById("selectTeamButton").parentElement;
    selectButtonContainer.className = "d-flex align-items-center gap-2";
    
    // Add points button if it doesn't exist
    if (!document.getElementById("addTeamPointsButton")) {
        const addPointsBtn = document.createElement("button");
        addPointsBtn.id = "addTeamPointsButton";
        addPointsBtn.className = "btn btn-outline-success";
        addPointsBtn.innerHTML = "+";
        
        addPointsBtn.addEventListener('click', function() {
            if (currentSelectedTeam) {
                // Get total points before adding new points
                const previousPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
                
                // Add points to each team member
                currentSelectedTeam.forEach(studentName => {
                    const student = classes[currentClass].find(s => s.name === studentName);
                    if (student) {
                        student.points++;
                    }
                });
                
                // Get new total points after adding team points
                const currentPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
                
                // Check for milestone
                checkAndCelebrateMilestone(previousPoints, currentPoints);
                
                // Show toast notification with team members
                showPointsToast(currentSelectedTeam);
                
                // Save and update displays
                saveStats();
                updateStats();
                updateStudentsTab();
                updateLeaderboard();
                updateProgressTracker();
            }
        });
        
        selectButtonContainer.appendChild(addPointsBtn);
    }
    
    // Launch fireworks from the button container
    launchFireworks(selectButtonContainer);

    // Update stats for team selections
    if (!stats[currentClass]) stats[currentClass] = {};
    if (!stats[currentClass]['_teamSelections']) {
        stats[currentClass]['_teamSelections'] = { count: 0, selections: [] };
    }
    stats[currentClass]['_teamSelections'].count++;
    stats[currentClass]['_teamSelections'].selections.push(new Date().toISOString());

    // Update the today's selections count
    updateTodaySelectionsCount();

    saveStats();
    updateStats();
    updateProgressTracker();
}

function setupTeamManagement() {
  // Add event listeners for new team management features
  document.getElementById('rerollTeams').addEventListener('click', () => {
    generateTeams(document.getElementById('numTeams').value);
  });

  document.getElementById('saveTeamSet').addEventListener('click', saveTeamSet);
  document.getElementById('savedTeamSetsSelect').addEventListener('change', loadTeamSet);
  
  // Show team save controls when teams are generated
  document.getElementById('teamSaveControls').style.display = 'block';
}

function saveTeamSet() {
  const teamSetName = document.getElementById('teamSetName').value.trim();
  if (!teamSetName || !currentClass || !currentTeams.length) return;

  if (!savedTeamSets[currentClass]) {
    savedTeamSets[currentClass] = {};
  }

  savedTeamSets[currentClass][teamSetName] = {
    date: new Date().toISOString(),
    teams: currentTeams
  };

  // Update student records
  currentTeams.forEach((team, teamIndex) => {
    team.forEach(studentName => {
      const student = classes[currentClass].find(s => s.name === studentName);
      if (student) {
        if (!student.teams[teamSetName]) {
          student.teams[teamSetName] = teamIndex + 1;
        }
      }
    });
  });

  saveStats();
  updateSavedTeamSetsSelect();
}

function loadTeamSet(teamSetName) {
    const savedTeamSets = JSON.parse(localStorage.getItem('teamSets')) || {};
    const selectedTeamSet = savedTeamSets[currentClass]?.[teamSetName];

    if (selectedTeamSet) {
        currentTeams = selectedTeamSet.teams;
        document.getElementById('numTeams').value = selectedTeamSet.teams.length;
        displayTeams();
    }
}

function updateSavedTeamSetsSelect() {
    const select = document.getElementById('savedTeamSetsSelect');
    const container = select.parentElement;
    
    // Clear existing buttons first
    const existingButtons = container.querySelectorAll('.team-action-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Create a flex container for the dropdown and buttons
    const flexContainer = document.createElement('div');
    flexContainer.className = 'd-flex gap-2';
    
    // Move the select into the flex container
    select.parentNode.insertBefore(flexContainer, select);
    flexContainer.appendChild(select);
    
    // Reset the select
    select.innerHTML = '<option value="">Load Saved Team Set</option>';
    select.className = 'form-select'; // Ensure proper styling
    
    if (currentClass && savedTeamSets[currentClass]) {
        Object.keys(savedTeamSets[currentClass]).forEach(teamSetName => {
            const option = document.createElement('option');
            option.value = teamSetName;
            option.textContent = teamSetName;
            select.appendChild(option);
        });

        // Add Edit and Remove buttons
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary team-action-btn';
        editBtn.textContent = 'Edit';
        editBtn.onclick = editSelectedTeamSet;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger team-action-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = removeSelectedTeamSet;

        flexContainer.appendChild(editBtn);
        flexContainer.appendChild(removeBtn);
    }
}

function removeSelectedTeamSet() {
    const select = document.getElementById('savedTeamSetsSelect');
    const teamSetName = select.value;
    
    if (!teamSetName) {
        alert('Please select a team set first');
        return;
    }

    if (confirm(`Are you sure you want to delete the team set "${teamSetName}"? This action cannot be undone.`)) {
        delete savedTeamSets[currentClass][teamSetName];
        
        // Remove team assignments from students
        classes[currentClass].forEach(student => {
            if (student.teams && student.teams[teamSetName]) {
                delete student.teams[teamSetName];
            }
        });

        saveStats();
        updateSavedTeamSetsSelect();
        displayTeams(); // Clear the display
    }
}

function editSelectedTeamSet() {
    const select = document.getElementById('savedTeamSetsSelect');
    const teamSetName = select.value;
    
    if (!teamSetName) {
        alert('Please select a team set first');
        return;
    }

    const teams = savedTeamSets[currentClass][teamSetName].teams;
    
    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'mt-3';
    editForm.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Edit Teams: ${teamSetName}</h5>
            </div>
            <div class="card-body">
                ${teams.map((team, index) => `
                    <div class="mb-3">
                        <label class="form-label">Team ${index + 1}</label>
                        <textarea class="form-control team-edit-area" 
                                data-team-index="${index}"
                                rows="3">${team.join('\n')}</textarea>
                    </div>
                `).join('')}
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-secondary" onclick="this.closest('.card').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveTeamEdits('${teamSetName}')">Save Changes</button>
                </div>
            </div>
        </div>
    `;

    // Find a good place to insert the form
    const teamsList = document.getElementById('teamsList');
    if (teamsList) {
        teamsList.insertBefore(editForm, teamsList.firstChild);
    }
}

function saveTeamEdits(teamSetName) {
    // Get all textareas before any DOM manipulation
    const editAreas = document.querySelectorAll('.team-edit-area');
    const newTeams = Array.from(editAreas).map(textarea => 
        textarea.value.split('\n')
            .map(name => name.trim())
            .filter(name => name)
    );

    // Update the teams
    savedTeamSets[currentClass][teamSetName].teams = newTeams;
    
    // Update student records
    classes[currentClass].forEach(student => {
        if (student.teams) {
            delete student.teams[teamSetName];
        }
    });

    newTeams.forEach((team, teamIndex) => {
        team.forEach(studentName => {
            const student = classes[currentClass].find(s => s.name === studentName);
            if (student) {
                if (!student.teams) student.teams = {};
                student.teams[teamSetName] = teamIndex + 1;
            }
        });
    });

    saveStats();
    updateSavedTeamSetsSelect();
    displayTeams();
    
    // Find and remove the edit form card
    const editCard = document.querySelector('.card:has(.team-edit-area)');
    if (editCard) {
        editCard.remove();
    }
}

function addPointsToStudent(studentName) {
  const student = classes[currentClass].find(s => s.name === studentName);
  if (student) {
    student.points++;
    saveStats();
    updateStudentList();
    updateStats();
  }
}

// Add a new function to update the header
function updateTeamHeader() {
  const headerContainer = document.getElementById("teamSetHeader");
  if (!headerContainer) return;
  
  const teamSetName = document.getElementById('teamSetName').value.trim();
  headerContainer.innerHTML = teamSetName ? `<h4>${teamSetName}</h4>` : '<h4>Teams</h4>';
}

function updateStudentsTab() {
    const studentsDiv = document.getElementById("students");
    if (!studentsDiv || !currentClass) return;

    let html = `
        <div class="container">
            <div class="row">
                <div class="col">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Days Since Picked</th>
                                <th>Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    classes[currentClass]
        .filter(student => !student.isClassStudent) // Exclude CLASS student from display
        .forEach(student => {
            // Calculate days since last picked
            let daysSincePicked = '';
            let rowClass = '';
            
            if (stats[currentClass]?.[student.name]?.selections?.length > 0) {
                const lastPicked = new Date(stats[currentClass][student.name].selections.slice(-1)[0]);
                const today = new Date();
                const diffTime = Math.abs(today - lastPicked);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                daysSincePicked = diffDays;
                
                // Add visual indicators based on days since picked
                if (diffDays >= 14) {
                    rowClass = 'table-danger';  // Red background for 14+ days
                } else if (diffDays >= 7) {
                    rowClass = 'table-warning';  // Yellow background for 7-13 days
                } else if (diffDays >= 0) {     // Changed this condition to explicitly check for recent picks
                    rowClass = 'table-success';  // Green background for 0-6 days
                }
            } else {
                daysSincePicked = 'Never';
                rowClass = 'table-danger';  // Red background for never picked
            }

            const isPreselected = preselectedStudent === student.name;
            html += `
                <tr data-student="${student.name}" class="${rowClass}">
                    <td>${student.name}</td>
                    <td>${daysSincePicked}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" 
                            onclick="addPoint('${student.name}')">+</button>
                        <button class="btn btn-sm btn-outline-danger me-2" 
                            onclick="removePoint('${student.name}')">-</button>
                        ${student.points}
                    </td>
                    <td>
                        <button class="btn btn-sm ${isPreselected ? 'btn-warning' : 'btn-outline-info'} me-2" 
                            onclick="${isPreselected ? 'undoPreselect' : 'preselect'}('${student.name}')">
                            ${isPreselected ? 'Undo' : 'Next'}
                        </button>
                        <button class="btn btn-sm btn-outline-secondary me-2" 
                            onclick="editStudentName('${student.name}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" 
                            onclick="removeStudent('${student.name}')">Remove</button>
                    </td>
                </tr>
            `;
        });

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    studentsDiv.innerHTML = html;
}

function updateClassesTab() {
    const classesList = document.getElementById('classesList');
    if (!classesList) return;

    classesList.innerHTML = '';

    Object.keys(classes).forEach(className => {
        const classDiv = document.createElement('div');
        classDiv.className = `class-item mb-3 p-3 border rounded ${className === currentClass ? 'border-primary' : ''}`;
        
        // Create the main class row with buttons
        const classRow = document.createElement('div');
        classRow.className = 'd-flex justify-content-between align-items-center';
        classRow.innerHTML = `
          <h5 class="mb-0">${className}</h5>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-info select-class-btn">Select</button>
            <button class="btn btn-sm btn-outline-secondary edit-class-btn">Edit</button>
            <button class="btn btn-sm btn-outline-danger delete-class-btn">Delete</button>
          </div>
        `;
        
        // Create the edit area (hidden by default)
        const editArea = document.createElement('div');
        editArea.className = 'edit-area mt-3';
        editArea.style.display = 'none';
        
        // Create textarea with current students, excluding CLASS student
        const studentsList = classes[className]
            .filter(student => !student.isClassStudent)  // Filter out CLASS student
            .map(student => student.name)
            .join('\n');
        
        editArea.innerHTML = `
          <textarea class="form-control mb-2" rows="5">${studentsList}</textarea>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary cancel-edit-btn">Cancel</button>
            <button class="btn btn-primary save-edit-btn">Save Changes</button>
          </div>
        `;
        
        classDiv.appendChild(classRow);
        classDiv.appendChild(editArea);
        
        // Add event listeners
        const selectBtn = classDiv.querySelector('.select-class-btn');
        const editBtn = classDiv.querySelector('.edit-class-btn');
        const deleteBtn = classDiv.querySelector('.delete-class-btn');
        const cancelBtn = classDiv.querySelector('.cancel-edit-btn');
        const saveBtn = classDiv.querySelector('.save-edit-btn');
        const textarea = classDiv.querySelector('textarea');
        
        // Select button
        selectBtn.onclick = () => {
            const classSelect = document.getElementById('classSelect');
            classSelect.value = className;
            
            // Update borders before triggering change
            const allClassDivs = document.querySelectorAll('.class-item');
            allClassDivs.forEach(div => div.classList.remove('border-success'));
            classDiv.classList.add('border-success');
            
            // Trigger the change event
            classSelect.dispatchEvent(new Event('change'));
        };
        
        // Edit button
        editBtn.onclick = () => {
            editArea.style.display = 'block';
        };
        
        // Cancel button
        cancelBtn.onclick = () => {
            // Reset textarea content, excluding CLASS student
            textarea.value = classes[className]
                .filter(student => !student.isClassStudent)
                .map(student => student.name)
                .join('\n');
            editArea.style.display = 'none';
        };
        
        // Save button
        saveBtn.onclick = () => {
            const newStudentNames = textarea.value
                .split('\n')
                .map(name => name.trim())
                .filter(name => name);
            
            // Create map of existing students with their data
            const existingStudents = {};
            classes[className]
                .filter(student => !student.isClassStudent)
                .forEach(student => {
                    const baseName = student.name.replace(/ \(\d+\)$/, '');
                    if (!existingStudents[baseName]) {
                        existingStudents[baseName] = student;
                    }
                });
            
            // Count occurrences for deduplication
            const nameCount = {};
            newStudentNames.forEach(name => {
                const trimmedName = name.trim();
                nameCount[trimmedName] = (nameCount[trimmedName] || 0) + 1;
            });
            
            // Create new student list with numbered duplicates
            const usedNames = {};
            const updatedStudents = [
                // Keep the CLASS student
                classes[className].find(student => student.isClassStudent),
                // Add all other students
                ...newStudentNames.map(name => {
                    const trimmedName = name.trim();
                    let finalName;
                    
                    if (nameCount[trimmedName] > 1) {
                        usedNames[trimmedName] = (usedNames[trimmedName] || 0) + 1;
                        finalName = `${trimmedName} (${usedNames[trimmedName]})`;
                        
                        if (usedNames[trimmedName] === 1 && existingStudents[trimmedName]) {
                            return {
                                ...existingStudents[trimmedName],
                                name: finalName
                            };
                        }
                    } else {
                        finalName = trimmedName;
                        if (existingStudents[trimmedName]) {
                            return existingStudents[trimmedName];
                        }
                    }
                    
                    return {
                        name: finalName,
                        points: 0,
                        teams: {}
                    };
                })
            ];
            
            // Update the class with the new student list
            classes[className] = updatedStudents;
            
            // Save and update everything
            saveStats();
            updateClassesTab();
            updateClassSelect();
            if (currentClass === className) {
                updateStudentSelector();
                updateStudentsTab();
                updateStats();
            }
            
            editArea.style.display = 'none';
        };
        
        // Delete button
        deleteBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete the class "${className}"? This action cannot be undone.`)) {
                delete classes[className];
                delete savedTeamSets[className];
                
                if (currentClass === className) {
                    currentClass = '';
                    currentTeams = [];
                    document.getElementById('classSelect').value = '';
                    updateStudentSelector();
                    updateStudentList();
                    updateTeamSelector();
                    updateStudentsTab();
                    updateStats();
                }
                
                saveStats();
                updateClassesTab();
                updateClassSelect();
            }
        };
        
        classesList.appendChild(classDiv);
    });
}

function launchFireworks(element) {
    if (!settings.fireworksEnabled) return;
    
    // Create container for fireworks
    const container = document.createElement('div');
    container.className = 'fireworks-container';
    
    // Create three firework elements
    for (let i = 0; i < 3; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        container.appendChild(firework);
    }
    
    document.body.appendChild(container);
    
    // Remove the container after animation
    setTimeout(() => {
        container.remove();
    }, 2000); // Match the animation duration
}

// Add this function to handle cleanup when changing classes or resetting
function cleanupSelectionButtons() {
    // Remove points buttons if they exist
    const addPointsBtn = document.getElementById("addPointsButton");
    if (addPointsBtn) addPointsBtn.remove();
    
    const addTeamPointsBtn = document.getElementById("addTeamPointsButton");
    if (addTeamPointsBtn) addTeamPointsBtn.remove();
}

// Update the point adding function
function addPoint(studentName) {
    if (studentName) {
        const student = classes[currentClass].find(s => s.name === studentName);
        if (student) {
            // Get total points before adding new point
            const previousPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
            
            student.points++;
            
            // Get new total points
            const currentPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
            
            // Check for milestone
            checkAndCelebrateMilestone(previousPoints, currentPoints);
            
            updateLeaderboard();
            updateStats();
            updateStudentsTab();
            updateProgressTracker();
            saveStats();
            
            // Launch fireworks near the student's row
            const studentRow = document.querySelector(`tr[data-student="${studentName}"]`);
            if (studentRow) {
                launchFireworks(studentRow);
            }
        }
        return;
    }
    
    const pointsInput = document.getElementById("pointsInput");
    if (!pointsInput) return;
    
    const points = parseInt(pointsInput.value);
    if (points) {
        const student = classes[currentClass].find(s => s.name === currentSelectedStudent);
        if (student) {
            student.points += points;
            updateLeaderboard();
            updateStats();
            updateStudentsTab();
            updateProgressTracker();
            saveStats();
            
            // Launch fireworks near the points input
            launchFireworks(pointsInput);
            
            pointsInput.value = "";
            const addPointsBtn = document.getElementById("addPointsButton");
            if (addPointsBtn) addPointsBtn.remove();
        }
    }
}

// Also update the button HTML in updateStudentsTab
function updateStudentsTab() {
    const studentsDiv = document.getElementById("students");
    if (!studentsDiv || !currentClass) return;

    let html = `
        <div class="container">
            <div class="row">
                <div class="col">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Days Since Picked</th>
                                <th>Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    classes[currentClass]
        .filter(student => !student.isClassStudent) // Exclude CLASS student from display
        .forEach(student => {
            // Calculate days since last picked
            let daysSincePicked = '';
            let rowClass = '';
            
            if (stats[currentClass]?.[student.name]?.selections?.length > 0) {
                const lastPicked = new Date(stats[currentClass][student.name].selections.slice(-1)[0]);
                const today = new Date();
                const diffTime = Math.abs(today - lastPicked);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                daysSincePicked = diffDays;
                
                // Add visual indicators based on days since picked
                if (diffDays >= 14) {
                    rowClass = 'table-danger';  // Red background for 2+ weeks
                } else if (diffDays >= 7) {
                    rowClass = 'table-warning';  // Yellow background for 1+ week
                }
            } else {
                daysSincePicked = 'Never';
                rowClass = 'table-danger';  // Red background for never picked
            }

            const isPreselected = preselectedStudent === student.name;
            html += `
                <tr data-student="${student.name}" class="${rowClass}">
                    <td>${student.name}</td>
                    <td>${daysSincePicked}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-success me-1" 
                            onclick="addPoint('${student.name}')">+</button>
                        <button class="btn btn-sm btn-outline-danger me-2" 
                            onclick="removePoint('${student.name}')">-</button>
                        ${student.points}
                    </td>
                    <td>
                        <button class="btn btn-sm ${isPreselected ? 'btn-warning' : 'btn-outline-info'} me-2" 
                            onclick="${isPreselected ? 'undoPreselect' : 'preselect'}('${student.name}')">
                            ${isPreselected ? 'Undo' : 'Next'}
                        </button>
                        <button class="btn btn-sm btn-outline-secondary me-2" 
                            onclick="editStudentName('${student.name}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" 
                            onclick="removeStudent('${student.name}')">Remove</button>
                    </td>
                </tr>
            `;
        });

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    studentsDiv.innerHTML = html;
}

function removePoint(studentName) {
    const student = classes[currentClass].find(s => s.name === studentName);
    if (student && student.points > 0) {  // Check if points are greater than 0
        student.points--;
        saveStats();
        updateStats();
        updateStudentsTab();
        updateProgressTracker();
        
        // Force rebuild the leaderboard content
        const leaderboardDiv = document.getElementById("leaderboard");
        if (leaderboardDiv) {
            // Get all students sorted by points
            const sortedStudents = [...classes[currentClass]].sort((a, b) => b.points - a.points);
            
            // Rebuild the table HTML
            let html = `
                <div class="leaderboard-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Student</th>
                                <th>Points</th>
                                <th style="width: 50%">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            sortedStudents.forEach((student, index) => {
                const percentage = (student.points / 50) * 100;
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${student.name}</td>
                        <td>${student.points}</td>
                        <td>
                            <div class="progress">
                                <div class="progress-bar" role="progressbar" 
                                    style="width: ${percentage}%;" 
                                    aria-valuenow="${student.points}" 
                                    aria-valuemin="0" 
                                    aria-valuemax="50">
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            // Update the content directly
            leaderboardDiv.innerHTML = html;
        }
    }
}

function removeStudent(studentName) {
    // Show confirmation dialog
    const confirmDelete = confirm(`Are you sure you want to remove ${studentName} from the class?`);
    
    if (confirmDelete) {
        // First, visually indicate the removal
        const studentRow = document.querySelector(`tr[data-student="${studentName}"]`);
        if (studentRow) {
            studentRow.style.transition = 'all 0.5s';
            studentRow.style.opacity = '0.5';
            studentRow.style.textDecoration = 'line-through';
            
            // Remove after a short delay to allow for visual transition
            setTimeout(() => {
                // Remove student from the class
                classes[currentClass] = classes[currentClass].filter(student => student.name !== studentName);
                
                // Remove student from any teams
                if (currentTeams.length) {
                    currentTeams = currentTeams.map(team => team.filter(name => name !== studentName));
                    currentTeams = currentTeams.filter(team => team.length > 0);
                }
                
                // Remove student from stats
                if (stats[currentClass] && stats[currentClass][studentName]) {
                    delete stats[currentClass][studentName];
                }
                
                // Save changes
                saveStats();
                saveToLocalStorage();
                
                // Update all displays
                updateStudentsTab();
                updateLeaderboard();
                updateTeamSelector();
                updateStudentSelector();
                updateStats();
                
                // Show toast
                const toast = new bootstrap.Toast(Object.assign(document.createElement('div'), {
                    className: 'toast align-items-center text-white bg-danger border-0',
                    innerHTML: `
                        <div class="d-flex">
                            <div class="toast-body">
                                ${studentName} has been removed from the class.
                            </div>
                            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                    `
                }));
                
                // Ensure toast container exists
                let toastContainer = document.getElementById('toastContainer');
                if (!toastContainer) {
                    toastContainer = document.createElement('div');
                    toastContainer.id = 'toastContainer';
                    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                    document.body.appendChild(toastContainer);
                }
                
                toastContainer.appendChild(toast.element);
                toast.show();
                
                // Remove toast element after it's hidden
                toast.element.addEventListener('hidden.bs.toast', () => {
                    toast.element.remove();
                });
            }, 500); // Delay matches transition time
        }
    }
}

// Add new function to handle adding milestones
function addMilestone() {
    if (!currentClass) {
        alert('Please select a class first');
        return;
    }
    
    const pointsInput = document.getElementById('milestonePoints');
    const descriptionInput = document.getElementById('milestoneDescription');
    
    const points = parseInt(pointsInput.value);
    const description = descriptionInput.value.trim();

    if (!points || !description) {
        alert('Please enter both points and description');
        return;
    }

    // Initialize milestones array for this class if it doesn't exist
    if (!classMilestones[currentClass]) {
        classMilestones[currentClass] = [];
    }

    // Add new milestone
    classMilestones[currentClass].push({
        points: points,
        description: description
    });

    // Clear inputs
    pointsInput.value = '';
    descriptionInput.value = '';

    // Save and update display
    saveStats();
    updateMilestonesTab();
    updateProgressTracker();
}

// First, let's add a function to check if the container exists and create it if it doesn't
function ensureMilestonesContainer() {
    let milestonesContent = document.getElementById('milestonesContent');
    if (!milestonesContent) {
        // Find the milestones tab pane
        const milestonesTab = document.getElementById('milestones');
        if (milestonesTab) {
            // Create the container
            milestonesContent = document.createElement('div');
            milestonesContent.id = 'milestonesContent';
            milestonesContent.className = 'mt-4';
            milestonesTab.appendChild(milestonesContent);
            console.log("Created milestones container");
        } else {
            console.log("Could not find milestones tab");
            return null;
        }
    }
    return milestonesContent;
}

// Then modify the updateMilestonesTab function to use this
function updateMilestonesTab() {
    const milestonesContainer = document.getElementById('milestonesContent');
    if (!milestonesContainer) {
        console.log("No milestones container found");
        return;
    }
    
    milestonesContainer.innerHTML = '';
    
    // Always create and add the form first
    const form = document.createElement('form');
    form.className = 'mt-3';
    form.innerHTML = `
        <div class="row g-3">
            <div class="col-auto">
                <input type="number" class="form-control" id="newMilestonePoints" placeholder="Points" required>
            </div>
            <div class="col">
                <input type="text" class="form-control" id="newMilestoneDescription" placeholder="Description" required>
            </div>
            <div class="col-auto">
                <button type="submit" class="btn btn-primary">Add Milestone</button>
            </div>
        </div>
    `;

    form.onsubmit = function(e) {
        e.preventDefault();
        const points = parseInt(document.getElementById('newMilestonePoints').value);
        const description = document.getElementById('newMilestoneDescription').value.trim();
        
        if (points && description) {
            if (!classMilestones[currentClass]) {
                classMilestones[currentClass] = [];
            }
            classMilestones[currentClass].push({ points, description });
            saveStats();
            updateMilestonesTab();
            updateProgressTracker();
            
            // Clear form
            document.getElementById('newMilestonePoints').value = '';
            document.getElementById('newMilestoneDescription').value = '';
        }
    };

    milestonesContainer.appendChild(form);
    
    // Show message if no milestones and no class selected
    if (!currentClass) {
        milestonesContainer.appendChild(
            Object.assign(document.createElement('p'), {
                className: 'text-muted mt-3',
                textContent: 'Please select a class first'
            })
        );
        return;
    }
    
    // Initialize milestones array for this class if it doesn't exist
    if (!classMilestones[currentClass]) {
        classMilestones[currentClass] = [];
    }

    // Get current total points for the class
    const currentTotalPoints = classes[currentClass].reduce((sum, student) => sum + (student.points || 0), 0);

    // Create and add the table if there are milestones
    if (classMilestones[currentClass].length > 0) {
        const table = document.createElement('table');
        table.className = 'table mt-4';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Points</th>
                    <th>Description</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        // Sort milestones by points
        const sortedMilestones = [...classMilestones[currentClass]].sort((a, b) => a.points - b.points);

        // Add each milestone
        sortedMilestones.forEach(milestone => {
            const row = document.createElement('tr');
            // Add table-success class if milestone is completed
            if (currentTotalPoints >= milestone.points) {
                row.className = 'table-success';
            }
            row.innerHTML = `
                <td>${milestone.points}</td>
                <td>${milestone.description}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removeMilestone(${milestone.points}, '${milestone.description.replace(/'/g, "\\'")}')">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        milestonesContainer.appendChild(table);
    } else {
        // Show message when no milestones exist for the class
        milestonesContainer.appendChild(
            Object.assign(document.createElement('p'), {
                className: 'text-muted mt-3',
                textContent: 'No milestones set for this class.'
            })
        );
    }
}

// Add this new function
function removeMilestone(points, description) {
    const index = classMilestones[currentClass].findIndex(m => 
        m.points === points && m.description === description
    );
    
    if (index !== -1) {
        classMilestones[currentClass].splice(index, 1);
        saveStats();
        updateMilestonesTab();
        updateProgressTracker();
    }
}

// Add this helper function before updateProgressTracker
function getClassData() {
    if (!currentClass || !classes[currentClass]) return null;
    
    const totalPoints = classes[currentClass].reduce((sum, student) => sum + (student.points || 0), 0);
    
    return {
        totalPoints: totalPoints
    };
}

// Add function to update progress tracker
function updateProgressTracker() {
    const container = document.getElementById('progressTracker');
    if (!container || !currentClass || !settings.showMilestonesTab) {
        if (container) {
            container.style.display = 'none';
        }
        return;
    }

    // Get class data and milestones
    const classData = getClassData();
    if (!classData) {
        container.style.display = 'none';
        return;
    }
    
    // Load milestones for current class
    const allMilestones = JSON.parse(localStorage.getItem('classMilestones')) || {};
    const classMilestones = allMilestones[currentClass] || [];
    
    // Sort milestones by points required
    const sortedMilestones = classMilestones.sort((a, b) => a.points - b.points);
    
    // Find next milestone
    const nextMilestone = sortedMilestones.find(m => m.points > classData.totalPoints);
    
    // Calculate percentage
    const percentage = nextMilestone 
        ? (classData.totalPoints / nextMilestone.points) * 100
        : 100;
    
    // Generate HTML
    let html = `
        <div class="progress-bg">
            <div class="progress-bar" style="width: ${percentage}%">
                <h3 class="raised">${classData.totalPoints}</h3>
            </div>
            <h3 class="goal">
                ${nextMilestone 
                    ? `${nextMilestone.points} - ${nextMilestone.description}`
                    : 'All milestones reached!'}
            </h3>
        </div>
    `;

    container.innerHTML = html;
    container.style.display = 'block';
}

// Also let's verify the getClassData function
function getClassData() {
    if (!currentClass || !classes[currentClass]) return null;
    
    const totalPoints = classes[currentClass].reduce((sum, student) => {
        return sum + (Number(student.points) || 0);
    }, 0);
    
    return {
        totalPoints: totalPoints
    };
}

// Update handlePointsSubmission function
function handlePointsSubmission(event, isTeam = false) {
    event.preventDefault();
    
    const form = event.target;
    const pointsInput = form.querySelector('input[type="number"]');
    const points = parseInt(pointsInput.value);
    
    if (points) {
        if (isTeam && currentSelectedTeam) {
            currentSelectedTeam.forEach(studentName => {
                const student = classes[currentClass].find(s => s.name === studentName);
                if (student) {
                    student.points += points;
                }
            });
        } else if (!isTeam && currentSelectedStudent) {
            const student = classes[currentClass].find(s => s.name === currentSelectedStudent);
            if (student) {
                student.points += points;
            }
        }
        
        // Show toast
        const toast = new bootstrap.Toast(document.getElementById('pointsToast'));
        document.getElementById('pointsToastBody').textContent = 
            `Added ${points} point${points !== 1 ? 's' : ''} to ${isTeam ? 'team' : currentSelectedStudent}`;
        
        // Update everything BEFORE showing toast
        updateLeaderboard();
        updateStats();
        updateStudentsTab();
        updateProgressTracker();
        saveStats();
        
        // Show toast after updates
        toast.show();
        
        // Reset form
        form.reset();
        
        // Remove the form
        const formContainer = document.getElementById(isTeam ? 'teamPointsForm' : 'pointsForm');
        if (formContainer) {
            formContainer.remove();
        }
    }
}

// Also update the setupPointsForm function to ensure it's using handlePointsSubmission
function setupPointsForm(student) {
    const existingForm = document.getElementById('pointsForm');
    if (existingForm) existingForm.remove();
    
    const form = document.createElement('form');
    form.id = 'pointsForm';
    form.className = 'input-group mt-2';
    form.innerHTML = `
        <input type="number" class="form-control" id="pointsInput" min="1" placeholder="Points to add">
        <button class="btn btn-success" type="submit" id="addPointsButton">Add Points</button>
    `;
    
    form.onsubmit = (e) => handlePointsSubmission(e, false);
    
    return form;
}

// Add this function to handle overall visibility
function updateContentVisibility() {
    const hasClassSelected = currentClass !== "" && currentClass !== undefined;
    
    // Handle nav-tabs specifically to maintain horizontal layout
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) {
        navTabs.style.display = hasClassSelected ? 'flex' : 'none';
    }
    
    // Handle other elements
    const elements = [
        document.querySelector('.tab-content'),    // Tab contents
    ];
    
    // Show/hide elements based on class selection
    elements.forEach(element => {
        if (element) {
            element.style.display = hasClassSelected ? 'block' : 'none';
        }
    });
    
    // Handle the no class message
    const contentContainer = document.getElementById('content-container');
    let noClassMessage = document.getElementById('noClassMessage');
    
    if (!hasClassSelected) {
        if (!noClassMessage) {
            noClassMessage = document.createElement('div');
            noClassMessage.id = 'noClassMessage';
            noClassMessage.className = 'text-center mt-5';
            noClassMessage.innerHTML = `
                <h4 class="text-muted">Please select a class to begin</h4>
                <p class="text-muted">Choose a class from the dropdown menu above</p>
            `;
            if (contentContainer) {
                contentContainer.appendChild(noClassMessage);
            }
        }
    } else if (noClassMessage) {
        noClassMessage.remove();
    }
}

// Add these new functions to handle preselection
function preselect(studentName) {
    preselectedStudent = studentName;
    updateStudentsTab();
}

function undoPreselect(studentName) {
    preselectedStudent = null;
    updateStudentsTab();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    } else {
        // Initialize default settings if none exist
        settings = {
            fireworksEnabled: true,
            showTeamsTab: true,
            showLeaderboardTab: true,
            showMilestonesTab: true,
            showStatsTab: true
        };
        saveSettings();
    }
    
    // Update UI to match settings if elements exist
    const fireworksEnabledInput = document.getElementById('fireworksEnabled');
    const showTeamsTabInput = document.getElementById('showTeamsTab');
    const showLeaderboardTabInput = document.getElementById('showLeaderboardTab');
    const showMilestonesTabInput = document.getElementById('showMilestonesTab');
    const showStatsTabInput = document.getElementById('showStatsTab');
    
    if (fireworksEnabledInput) fireworksEnabledInput.checked = settings.fireworksEnabled;
    if (showTeamsTabInput) showTeamsTabInput.checked = settings.showTeamsTab;
    if (showLeaderboardTabInput) showLeaderboardTabInput.checked = settings.showLeaderboardTab;
    if (showMilestonesTabInput) showMilestonesTabInput.checked = settings.showMilestonesTab;
    if (showStatsTabInput) showStatsTabInput.checked = settings.showStatsTab;
    
    // Always update visibility regardless of document state
    updateTabVisibility();
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

function updateTabVisibility() {
    // Get tab elements
    const teamsTab = document.querySelector('a[href="#teams"]')?.parentElement;
    const teamPickerTab = document.querySelector('a[href="#teamPicker"]')?.parentElement;
    const leaderboardTab = document.querySelector('a[href="#leaderboard"]')?.parentElement;
    const milestonesTab = document.querySelector('a[href="#milestones"]')?.parentElement;
    const statsTab = document.querySelector('a[href="#stats"]')?.parentElement;
    
    // Get progress tracker element
    const progressTracker = document.getElementById('progressTracker');
    
    // Check if a class is selected
    const hasClassSelected = currentClass !== "" && currentClass !== undefined;
    
    // Only update if elements exist
    if (teamsTab) {
        teamsTab.style.display = settings.showTeamsTab ? '' : 'none';
    }
    if (teamPickerTab) {
        teamPickerTab.style.display = settings.showTeamsTab ? '' : 'none';
    }
    if (leaderboardTab) {
        leaderboardTab.style.display = settings.showLeaderboardTab ? '' : 'none';
    }
    if (milestonesTab) {
        milestonesTab.style.display = settings.showMilestonesTab ? '' : 'none';
    }
    if (progressTracker) {
        progressTracker.style.display = (hasClassSelected && settings.showMilestonesTab) ? 'block' : 'none';
    }
    if (statsTab) {
        statsTab.style.display = settings.showStatsTab ? '' : 'none';
    }
}

function initializeSettings() {
    // Load settings first
    loadSettings();
    
    // Get all the settings elements
    const fireworksEnabledInput = document.getElementById('fireworksEnabled');
    const showTeamsTabInput = document.getElementById('showTeamsTab');
    const showLeaderboardTabInput = document.getElementById('showLeaderboardTab');
    const showMilestonesTabInput = document.getElementById('showMilestonesTab');
    const showStatsTabInput = document.getElementById('showStatsTab');
    
    // Data management buttons
    const exportBtn = document.getElementById('exportData');
    const importBtn = document.getElementById('importData');
    const importFileInput = document.getElementById('importFile');
    const resetBtn = document.getElementById('resetData');
    
    // Add event listeners for settings changes if elements exist
    if (fireworksEnabledInput) {
        fireworksEnabledInput.addEventListener('change', (e) => {
            settings.fireworksEnabled = e.target.checked;
            saveSettings();
        });
    }
    
    if (showTeamsTabInput) {
        showTeamsTabInput.addEventListener('change', (e) => {
            settings.showTeamsTab = e.target.checked;
            updateTabVisibility();
            saveSettings();
        });
    }
    
    if (showLeaderboardTabInput) {
        showLeaderboardTabInput.addEventListener('change', (e) => {
            settings.showLeaderboardTab = e.target.checked;
            updateTabVisibility();
            saveSettings();
        });
    }
    
    if (showMilestonesTabInput) {
        showMilestonesTabInput.addEventListener('change', (e) => {
            settings.showMilestonesTab = e.target.checked;
            updateTabVisibility();
            if (e.target.checked) {
                updateProgressTracker(); // Update progress tracker when showing
            }
            saveSettings();
        });
    }
    
    if (showStatsTabInput) {
        showStatsTabInput.addEventListener('change', (e) => {
            settings.showStatsTab = e.target.checked;
            updateTabVisibility();
            saveSettings();
        });
    }
    
    // Data management button listeners with debug logs
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            console.log('Export button clicked');
            exportAllData();
        });
    }
    
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => {
            console.log('Import button clicked');
            importFileInput.click();
        });
        
        importFileInput.addEventListener('change', (e) => {
            console.log('Import file selected');
            importData(e);
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            console.log('Reset button clicked');
            resetAllData();
        });
    }
}

// Data management functions
function exportAllData() {
    // Gather all data into one object
    const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
            classes,
            currentClass,
            stats,
            currentTeams,
            savedTeamSets,
            classMilestones,
            settings
        }
    };
    
    // Convert to JSON and create blob
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-picker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate the imported data has the expected structure
            if (!importedData.data) {
                throw new Error('Invalid file format');
            }
            
            // Update all data structures
            classes = importedData.data.classes || {};
            currentClass = importedData.data.currentClass || "";
            stats = importedData.data.stats || {};
            currentTeams = importedData.data.currentTeams || [];
            savedTeamSets = importedData.data.savedTeamSets || {};
            classMilestones = importedData.data.classMilestones || {};
            settings = importedData.data.settings || {
                fireworksEnabled: true,
                showTeamsTab: true,
                showLeaderboardTab: true,
                showMilestonesTab: true,
                showStatsTab: true
            };
            
            // Save all data to localStorage
            saveStats();
            saveSettings();
            
            // Update UI
            loadSettings();
            updateClassSelect();
            if (currentClass) {
                updateStudentSelector();
                updateTeamSelector();
                updateLeaderboard();
                updateStats();
                updateStudentsTab();
                updateClassesTab();
                updateProgressTracker();
            }
            
            // Reset file input
            e.target.value = '';
            
            // Show success message
            alert('Data imported successfully!');
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing data: ' + error.message);
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file');
    };
    
    reader.readAsText(file);
}

function resetAllData() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone!')) {
        try {
            // Clear all localStorage
            localStorage.clear();
            
            // Reset all global variables to defaults
            classes = {};
            currentClass = "";
            stats = {};
            currentTeams = [];
            savedTeamSets = {};
            classMilestones = {};
            settings = {
                fireworksEnabled: true,
                showTeamsTab: true,
                showLeaderboardTab: true,
                showMilestonesTab: true,
                showStatsTab: true
            };
            
            // Save default state
            saveStats();
            saveSettings();
            
            // Update UI
            loadSettings();
            updateClassSelect();
            updateStudentSelector();
            updateTeamSelector();
            updateLeaderboard();
            updateStats();
            updateStudentsTab();
            updateClassesTab();
            updateProgressTracker();
            
            alert('All data has been reset successfully!');
            
        } catch (error) {
            console.error('Reset error:', error);
            alert('Error resetting data: ' + error.message);
        }
    }
}

// Add this new function to calculate and update today's selections count
function updateTodaySelectionsCount() {
    const todayCount = document.getElementById('todaySelectionsCount');
    if (!todayCount) return;

    if (!currentClass || !stats[currentClass]) {
        todayCount.textContent = '0';
        return;
    }

    // Calculate selections made today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todaySelections = 0;
    Object.values(stats[currentClass]).forEach(studentStats => {
        if (studentStats.selections) {
            todaySelections += studentStats.selections.filter(date => {
                const selectionDate = new Date(date);
                selectionDate.setHours(0, 0, 0, 0);
                return selectionDate.getTime() === today.getTime();
            }).length;
        }
    });

    todayCount.textContent = todaySelections;
}

// Add function to handle class point button
function addClassPoint() {
    if (!currentClass || !classes[currentClass]) return;
    
    const classStudent = classes[currentClass].find(s => s.isClassStudent);
    if (classStudent) {
        // Get total points before adding new point
        const previousPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
        
        classStudent.points++;
        
        // Get new total points
        const currentPoints = classes[currentClass].reduce((sum, s) => sum + s.points, 0);
        
        // Check for milestone
        checkAndCelebrateMilestone(previousPoints, currentPoints);
        
        showPointsToast("Class");
        saveStats();
        updateStats();
        updateLeaderboard();
        updateProgressTracker();
    }
}

function checkAndCelebrateMilestone(previousPoints, currentPoints) {
    if (!currentClass || !classMilestones[currentClass]) return;
    
    // Sort milestones by points
    const sortedMilestones = [...classMilestones[currentClass]].sort((a, b) => a.points - b.points);
    
    // Find the milestone that was just reached
    const reachedMilestone = sortedMilestones.find(m => 
        m.points > previousPoints && m.points <= currentPoints
    );
    
    if (reachedMilestone) {
        // Find next milestone if it exists
        const nextMilestone = sortedMilestones.find(m => m.points > currentPoints);
        
        // Update modal content
        const messageEl = document.getElementById('milestoneMessage');
        const nextMilestoneEl = document.getElementById('nextMilestoneInfo');
        
        messageEl.innerHTML = `
            Congratulations!<br>
            You've reached ${reachedMilestone.points} points:<br>
            "${reachedMilestone.description}"
        `;
        
        if (nextMilestone) {
            nextMilestoneEl.innerHTML = `
                <p class="text-muted">
                    Next milestone at ${nextMilestone.points} points:<br>
                    "${nextMilestone.description}"
                </p>
            `;
        } else {
            nextMilestoneEl.innerHTML = `
                <p class="text-muted">You've reached all milestones!</p>
            `;
        }
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('milestoneCelebrationModal'));
        modal.show();
        
        // Launch fireworks
        const modalElement = document.querySelector('.modal-content');
        launchFireworks(modalElement);
        
        // Launch more fireworks when modal is closed
        document.getElementById('milestoneCelebrationModal').addEventListener('hidden.bs.modal', function (e) {
            launchFireworks(document.body);
        }, { once: true }); // Use once: true to ensure the listener is removed after firing
    }
}

function updateVisibleTeams(startIndex) {
    const items = Array.from(document.querySelectorAll('.team-item'));
    const totalItems = items.length;
    
    if (totalItems === 0) return;

    // Reset all items
    items.forEach(item => {
        item.className = 'team-item';
    });

    // Ensure startIndex is within bounds
    startIndex = ((startIndex % totalItems) + totalItems) % totalItems;

    // Show all 5 positions
    const positions = [
        { index: ((startIndex - 2 + totalItems) % totalItems), class: 'position-far' },
        { index: ((startIndex - 1 + totalItems) % totalItems), class: 'position-near' },
        { index: startIndex, class: 'position-center' },
        { index: ((startIndex + 1) % totalItems), class: 'position-near-top' },
        { index: ((startIndex + 2) % totalItems), class: 'position-far-top' }
    ];

    positions.forEach(pos => {
        if (items[pos.index]) {
            items[pos.index].classList.add('visible-item', pos.class);
        }
    });
}

function handleNewClass(e) {
    e.preventDefault();
    const className = document.getElementById("newClassName").value.trim();
    const studentsList = document.getElementById("newClassStudents").value
        .split('\n')
        .map(name => name.trim())
        .filter(name => name);

    if (className && studentsList.length > 0) {
        // Create new class with CLASS student first
        classes[className] = [
            { name: "CLASS", points: 0, isClassStudent: true },
            ...studentsList.map(name => ({
                name: name,
                points: 0,
                teams: {}
            }))
        ];

        // Initialize empty team sets for the new class
        savedTeamSets[className] = {};

        // Initialize empty milestones for the new class (if using milestones)
        if (typeof classMilestones !== 'undefined') {
            classMilestones[className] = [];
        }

        // Save everything
        saveStats();

        // Update class select dropdown
        updateClassSelect();

        // Set this as the current class
        currentClass = className;
        document.getElementById('classSelect').value = className;

        // Reset current teams
        currentTeams = [];

        // Update all UI elements with empty/default states
        updateStudentSelector();
        updateTeamSelector();
        updateStudentsTab();
        updateStats();
        updateLeaderboard();
        updateProgressTracker();

        // Show the Add Class Point button
        const addClassPointBtn = document.getElementById('addClassPoint');
        if (addClassPointBtn) {
            addClassPointBtn.style.display = 'block';
        }

        // Save this as the last selected class
        saveLastSelectedClass(className);

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('newClassModal'));
        modal.hide();

        // Clear the form
        document.getElementById("newClassName").value = "";
        document.getElementById("newClassStudents").value = "";
    }
}

function editStudentName(oldName) {
    const student = classes[currentClass].find(s => s.name === oldName);
    if (!student) return;
    
    // Create an input field with the current name
    const newName = prompt('Enter new name:', student.name);
    
    // Check if user cancelled or entered an empty name
    if (!newName || newName.trim() === '') return;
    
    // Check if the new name already exists in the class
    const nameExists = classes[currentClass].some(s => 
        s.name.toLowerCase() === newName.trim().toLowerCase() && s.name !== oldName
    );
    
    if (nameExists) {
        alert('A student with this name already exists in the class.');
        return;
    }
    
    // Update the student's name
    student.name = newName.trim();
    
    // Update stats record if it exists
    if (stats[currentClass]?.[oldName]) {
        stats[currentClass][newName] = stats[currentClass][oldName];
        delete stats[currentClass][oldName];
    }
    
    // Update team assignments if any
    if (savedTeamSets[currentClass]) {
        Object.values(savedTeamSets[currentClass]).forEach(teamSet => {
            teamSet.teams = teamSet.teams.map(team => 
                team.map(name => name === oldName ? newName : name)
            );
        });
    }
    
    // Save changes and update displays
    saveStats();
    updateStudentsTab();
    updateLeaderboard();
    updateTeamSelector();
}
