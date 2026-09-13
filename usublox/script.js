// Global Database State
const users = {}; 

// DOM References
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');

const authBox = document.getElementById('auth-box');
const userDashboard = document.getElementById('user-dashboard');
const signedInText = document.getElementById('signed-in-text');
const adminPanel = document.getElementById('admin-panel');
const adminCmdInput = document.getElementById('admin-cmd');
const runCmdBtn = document.getElementById('run-cmd-btn');
const chatBox = document.getElementById('chat-box');
const gameView = document.getElementById('game-view');
const message = document.getElementById('message');

let currentUser = null;

// Helper function to append messages to global feed
function addChatMessage(sender, recipient, text) {
  const p = document.createElement('p');
  p.style.margin = "4px 0";
  if (recipient) {
    p.innerHTML = `<strong>[PM ${sender} &rarr; ${recipient}]:</strong> ${text}`;
  } else {
    p.innerHTML = `<strong>[${sender}]:</strong> ${text}`;
  }
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Global Game Launcher (Admin privileges apply across all game instances)
window.playGame = function(gameName) {
  if (!currentUser) return;
  gameView.style.display = 'block';
  gameView.innerHTML = `<h4>Now Playing: ${gameName}</h4><p>Status: Active in server. Global admin permissions loaded.</p>`;
};

// Sign Up Handler
signupBtn.addEventListener('click', () => {
  const user = usernameInput.value.trim();
  const pass = passwordInput.value;

  if (!user || !pass) {
    message.style.color = "red";
    message.innerText = "Please enter both username and password.";
    return;
  }

  if (users[user]) {
    message.style.color = "red";
    message.innerText = "Username already exists!";
    return;
  }

  // Grants automatic global admin power to 'usuthebanna'
  const role = (user.toLowerCase() === 'usuthebanna') ? 'admin' : 'player';

  users[user] = {
    password: pass,
    role: role,
    isBanned: false,
    isLoggedIn: false
  };

  message.style.color = "green";
  message.innerText = `Account created for ${user} (${role}). You can now sign in!`;
});

// Sign In Handler
signinBtn.addEventListener('click', () => {
  const user = usernameInput.value.trim();
  const pass = passwordInput.value;
  const account = users[user];

  if (!account || account.password !== pass) {
    message.style.color = "red";
    message.innerText = "Incorrect username or password. Access denied.";
    return;
  }

  // Block sign in if account has been banned by admin
  if (account.isBanned) {
    message.style.color = "red";
    message.innerText = "Access Denied: Your account has been banned from Usublox.";
    return;
  }

  // Successful Sign In
  currentUser = user;
  account.isLoggedIn = true;

  authBox.style.display = 'none';
  userDashboard.style.display = 'block';
  signedInText.innerText = `signed in ${user}`;

  // Reveal global admin console if user is admin
  if (account.role === 'admin') {
    adminPanel.style.display = 'block';
  } else {
    adminPanel.style.display = 'none';
  }

  message.innerText = '';
  addChatMessage("System", null, `${user} joined Usublox.`);
});

// Sign Out / Logout
signoutBtn.addEventListener('click', () => logoutUser("Signed out."));

function logoutUser(reason) {
  if (currentUser && users[currentUser]) {
    users[currentUser].isLoggedIn = false;
  }
  currentUser = null;
  authBox.style.display = 'block';
  userDashboard.style.display = 'none';
  gameView.style.display = 'none';
  usernameInput.value = '';
  passwordInput.value = '';
  message.style.color = "black";
  message.innerText = reason;
}

// Global Admin Command Parser
runCmdBtn.addEventListener('click', () => {
  if (!currentUser || users[currentUser]?.role !== 'admin') {
    alert("Unauthorized command execution.");
    return;
  }

  const input = adminCmdInput.value.trim();
  if (!input) return;

  // Command 1: ban [username]
  if (input.toLowerCase().startsWith('ban ')) {
    const targetUser = input.substring(4).trim();
    if (users[targetUser]) {
      users[targetUser].isBanned = true;
      users[targetUser].isLoggedIn = false;
      message.style.color = "green";
      message.innerText = `User [${targetUser}] has been permanently banned across all games.`;
      addChatMessage("System", null, `${targetUser} was banned from Usublox by Admin.`);
    } else {
      message.style.color = "red";
      message.innerText = `User [${targetUser}] does not exist.`;
    }
  }

  // Command 2: kick [username]
  else if (input.toLowerCase().startsWith('kick ')) {
    const targetUser = input.substring(5).trim();
    if (users[targetUser]) {
      if (users[targetUser].isLoggedIn) {
        users[targetUser].isLoggedIn = false;
        
        if (targetUser === currentUser) {
          logoutUser("You were kicked from the server.");
        } else {
          message.style.color = "green";
          message.innerText = `User [${targetUser}] was kicked from the session.`;
          addChatMessage("System", null, `${targetUser} was kicked from the server.`);
        }
      } else {
        message.style.color = "orange";
        message.innerText = `User [${targetUser}] is not currently online.`;
      }
    } else {
      message.style.color = "red";
      message.innerText = `User [${targetUser}] does not exist.`;
    }
  }

  // Command 3: message as [username] to [username] [text]
  else if (input.toLowerCase().startsWith('message as ')) {
    // Regex matches: message as <sender> to <recipient> <text>
    const regex = /^message as (\S+) to (\S+) (.+)$/i;
    const match = input.match(regex);

    if (match) {
      const sender = match[1];
      const recipient = match[2];
      const text = match[3];

      addChatMessage(sender, recipient, text);
      message.style.color = "green";
      message.innerText = `Dispatched spoofed message as [${sender}] to [${recipient}].`;
    } else {
      message.style.color = "red";
      message.innerText = "Syntax Error! Use: message as [sender] to [recipient] [message]";
    }
  } else {
    message.style.color = "red";
    message.innerText = "Unknown admin command.";
  }

  adminCmdInput.value = '';
});
