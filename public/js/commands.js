document.addEventListener('DOMContentLoaded', () => {
    loadCommands();
    setupEventListeners();
});

async function loadCommands() {
    try {
        const response = await fetch('/.netlify/functions/getCommands');
        const commands = await response.json();
        
        const commandList = document.getElementById('command-list');
        commandList.innerHTML = commands.map(cmd => `
            <div class="command-item" data-id="${cmd._id}">
                <input type="text" class="command-name" value="${cmd.name}">
                <textarea class="command-response">${cmd.response}</textarea>
                <button class="update-btn">Update</button>
                <button class="delete-btn">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading commands:', error);
    }
}

function setupEventListeners() {
    document.getElementById('add-command').addEventListener('click', async () => {
        const newCmd = {
            name: 'new_command',
            response: 'Default response'
        };

        try {
            await fetch('/.netlify/functions/addCommand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCmd)
            });
            loadCommands();
        } catch (error) {
            console.error('Error adding command:', error);
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const commandId = e.target.closest('.command-item').dataset.id;
            try {
                await fetch(`/.netlify/functions/deleteCommand/${commandId}`, {
                    method: 'DELETE'
                });
                loadCommands();
            } catch (error) {
                console.error('Error deleting command:', error);
            }
        }

        if (e.target.classList.contains('update-btn')) {
            const commandElem = e.target.closest('.command-item');
            const updatedCmd = {
                name: commandElem.querySelector('.command-name').value,
                response: commandElem.querySelector('.command-response').value
            };

            try {
                await fetch(`/.netlify/functions/updateCommand/${commandElem.dataset.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedCmd)
                });
                loadCommands();
            } catch (error) {
                console.error('Error updating command:', error);
            }
        }
    });
}

// Initialize auth functionality
(async () => {
    const authStatus = document.getElementById('auth-status');
    try {
        const response = await fetch('/.netlify/functions/getAuthStatus');
        const { authenticated, user } = await response.json();
        
        if (authenticated) {
            authStatus.innerHTML = `
                <p>Logged in as ${user.username}</p>
                <button onclick="logout()">Logout</button>
            `;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
})();

async function logout() {
    try {
        await fetch('/.netlify/functions/logout', { method: 'POST' });
        window.location.reload();
    } catch (error) {
        console.error('Logout failed:', error);
    }
}