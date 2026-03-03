// ==========================
// PAGE DETECTION
// ==========================
const path = window.location.pathname;


// ==========================
// LOGIN PAGE LOGIC
// ==========================
if (path.includes("index")) {

  let mode = "login";

  window.switchMode = function(newMode) {
    mode = newMode;

    document.getElementById("actionBtn").innerText =
      mode === "login" ? "Login" : "Create Account";

    document.getElementById("loginTab").classList.toggle("active", mode === "login");
    document.getElementById("signupTab").classList.toggle("active", mode === "signup");
  };

  window.handleAuth = function () {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    if (!username || !password) {
      alert("Please fill all fields.");
      return;
    }

    if (mode === "signup") {
      localStorage.setItem(username, JSON.stringify({ username, password, role }));
      alert("Account Created! Now login.");
      switchMode("login");
      return;
    }

    // LOGIN MODE
    const storedUser = JSON.parse(localStorage.getItem(username));

    if (!storedUser || storedUser.password !== password) {
      alert("Invalid credentials.");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(storedUser));
    window.location.href = "dashboard.html";
  };
}



// ==========================
// DASHBOARD LOGIC
// ==========================
if (path.includes("dashboard")) {

  const campusCenter = [30.7680, 76.5750];
  let map;
  let markers = [];
  let people = [];

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "index.html";
  }

  initDashboard();


  function initDashboard() {

    document.getElementById("userRole").innerText =
      currentUser.username + " (" + currentUser.role + ")";

    map = L.map('map', {
      maxBounds: [
        [30.7580, 76.5650],
        [30.7780, 76.5850]
      ]
    }).setView(campusCenter, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    generatePeople();
    renderPeople();
    updateCounts();
    populateDropdowns();
    handleRoleAccess();
    setupSearch();   // 🔥 SEARCH ENABLED HERE
  }


  function generatePeople() {

    function randomCoord() {
      return [
        campusCenter[0] + (Math.random() - 0.5) / 200,
        campusCenter[1] + (Math.random() - 0.5) / 200
      ];
    }

    // 33 Students
    for (let i = 1; i <= 33; i++) {
      people.push({ name: "Student " + i, role: "student", coords: randomCoord(), onBreak: false });
    }

    // 11 Teachers
    for (let i = 1; i <= 11; i++) {
      people.push({ name: "Teacher " + i, role: "teacher", coords: randomCoord(), onBreak: false });
    }

    // 5 HODs
    for (let i = 1; i <= 5; i++) {
      people.push({ name: "HOD " + i, role: "hod", coords: randomCoord(), onBreak: false });
    }

    // Ensure logged-in teacher/hod exists
    if (currentUser.role !== "student") {
      const exists = people.find(p => p.name === currentUser.username);
      if (!exists) {
        people.push({
          name: currentUser.username,
          role: currentUser.role,
          coords: randomCoord(),
          onBreak: false
        });
      }
    }
  }


  function renderPeople() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    people.forEach(person => {
      if (person.onBreak) return;

      let color =
        person.role === "student" ? "green" :
        person.role === "teacher" ? "blue" :
        "red";

      const marker = L.circleMarker(person.coords, {
        radius: 6,
        color: color
      }).addTo(map);

      marker.bindPopup(person.name + " (" + person.role + ")");
      markers.push(marker);
    });
  }


  function updateCounts() {
    document.getElementById("studentCount").innerText =
      people.filter(p => p.role === "student").length;

    document.getElementById("teacherCount").innerText =
      people.filter(p => p.role === "teacher").length;

    document.getElementById("hodCount").innerText =
      people.filter(p => p.role === "hod").length;
  }


  function populateDropdowns() {
    const teacherDropdown = document.getElementById("teacherDropdown");
    const hodDropdown = document.getElementById("hodDropdown");

    teacherDropdown.innerHTML = "";
    hodDropdown.innerHTML = "";

    people.filter(p => p.role === "teacher").forEach(t => {
      let option = document.createElement("option");
      option.value = t.name;
      option.textContent = t.name;
      teacherDropdown.appendChild(option);
    });

    people.filter(p => p.role === "hod").forEach(h => {
      let option = document.createElement("option");
      option.value = h.name;
      option.textContent = h.name;
      hodDropdown.appendChild(option);
    });

    teacherDropdown.onchange = () => focusPerson(teacherDropdown.value);
    hodDropdown.onchange = () => focusPerson(hodDropdown.value);
  }


  function focusPerson(name) {
    const person = people.find(p => p.name === name);
    if (person) {
      map.setView(person.coords, 18);
    }
  }


  // 🔥 SEARCH FUNCTION
  function setupSearch() {
    const searchInput = document.getElementById("searchInput");

    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {

        const value = searchInput.value.trim().toLowerCase();

        const person = people.find(p =>
          p.name.toLowerCase() === value
        );

        if (person) {
          map.setView(person.coords, 18);

          markers.forEach(marker => {
            if (
              marker.getLatLng().lat === person.coords[0] &&
              marker.getLatLng().lng === person.coords[1]
            ) {
              marker.openPopup();
            }
          });

        } else {
          alert("Person not found in campus.");
        }
      }
    });
  }


  window.toggleBreak = function () {
    if (currentUser.role === "student") return;

    const person = people.find(p => p.name === currentUser.username);

    if (person) {
      person.onBreak = !person.onBreak;
      renderPeople();
    }
  };


  function handleRoleAccess() {
    if (currentUser.role === "student") {
      document.getElementById("breakSection").style.display = "none";
    }
  }
}