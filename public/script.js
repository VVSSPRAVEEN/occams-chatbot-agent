document.addEventListener('DOMContentLoaded', () => {
    // Get references to the essential HTML elements we need to interact with.
    const form = document.getElementById('form');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');

    // Create a unique ID for this specific chat session when the page first loads.
    const sessionId = 'session_' + Date.now() + Math.random();

    // --- The Main Event Handler: This function runs every time the user submits the form ---
    form.addEventListener('submit', async (e) => {
        // 1. PREPARE THE CHAT
        e.preventDefault(); // Stop the browser from reloading the page on form submission.
        const userMessage = input.value.trim(); // Get the text from the input box.
        if (!userMessage) return; // If the user message is empty, do nothing.

        // Clear previous UI elements
        const existingSuggestions = document.getElementById('suggestions-container');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        input.value = ''; // Clear the input box.
        input.disabled = true; // Disable the input box so the user can't type while the bot is thinking.
        form.querySelector('button').disabled = true; // Disable the "Send" button.

        // 2. DISPLAY THE USER'S MESSAGE
        appendMessage(userMessage, 'user');
        
        // 3. SHOW THE "THINKING" INDICATOR
        // Display a "Thinking..." message with a timer to improve the user experience.
        const thinkingMessage = appendThinkingMessage();
        let seconds = 0;
        const timerInterval = setInterval(() => {
            seconds++;
            thinkingMessage.querySelector('.timer').textContent = `${seconds}s`;
        }, 1000);

        // 4. COMMUNICATE WITH THE SERVER
        try {
            // Send the user's message and the session ID to our backend API endpoint.
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, sessionId: sessionId }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const data = await response.json();
            
            // 5. DISPLAY THE BOT'S RESPONSE
            // Once we have the response, remove the "Thinking..." message.
            clearInterval(timerInterval); // Stop the timer immediately
            messages.removeChild(thinkingMessage);
            const botMessageElement = appendMessage(data.answer, 'bot');

            // Display sources and feedback buttons
            if (data.sources && data.sources.length > 0) {
                appendSources(data.sources, botMessageElement);
            }
            addFeedbackButtons(userMessage, data.answer, botMessageElement);
            
            // Display new suggestion buttons
            if (data.suggestions && data.suggestions.length > 0) {
                appendSuggestions(data.suggestions);
            }

        } catch (error) {
            // If anything goes wrong in the 'try' block (e.g., network error), show an error message.
            clearInterval(timerInterval); // Ensure timer stops on error
            if(thinkingMessage && thinkingMessage.parentNode) {
                messages.removeChild(thinkingMessage);
            }
            appendMessage('Sorry, an error occurred. Please check the server logs and try again.', 'bot error');
            console.error('Chat Fetch Error:', error);
        } finally {
            // This 'finally' block will ALWAYS run, whether there was an error or not.
            // It's the perfect place to clean up the UI.
            input.disabled = false; // Re-enable the input box.
            form.querySelector('button').disabled = false; // Re-enable the "Send" button.
            input.focus(); // Place the cursor back in the input box, ready for the user's next message.
        }
    });

    // --- Helper Functions: These functions keep the main code clean and organized. ---

    function appendThinkingMessage() {
        const item = document.createElement('div');
        item.className = 'message bot-message thinking-message';
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<span>Thinking...</span> <span class="timer">0s</span>`;
        item.appendChild(content);
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
        return item;
    }

    function appendMessage(text, type) {
        const item = document.createElement('div');
        item.className = `message ${type}-message`;
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;
        item.appendChild(content);
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
        return item;
    }

    function appendSources(sources, messageElement) {
        const sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'sources';
        sourcesContainer.innerHTML = '<strong>Sources:</strong>';
        const uniqueSources = new Map(sources.map(s => [s.url, s.title]).filter(([url, title]) => url));
        uniqueSources.forEach((title, url) => {
            const sourceLink = document.createElement('a');
            sourceLink.href = url;
            sourceLink.textContent = title || 'Source';
            sourceLink.target = '_blank';
            sourcesContainer.appendChild(sourceLink);
        });
        if (sourcesContainer.childElementCount > 1) {
            messageElement.querySelector('.message-content').appendChild(sourcesContainer);
        }
    }

    function addFeedbackButtons(query, answer, messageElement) {
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback';
        const thumbUp = document.createElement('button');
        thumbUp.textContent = '👍';
        const thumbDown = document.createElement('button');
        thumbDown.textContent = '👎';
        [thumbUp, thumbDown].forEach((button, index) => {
            button.addEventListener('click', async () => {
                feedbackContainer.innerHTML = '<em>Thank you!</em>';
                await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, answer, rating: index === 0 ? 'positive' : 'negative' })
                });
            });
            feedbackContainer.appendChild(button);
        });
        messageElement.appendChild(feedbackContainer);
    }

    function appendSuggestions(suggestions) {
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'suggestions-container';
        suggestions.forEach(text => {
            if (!text) return; // Skip if a suggestion is empty
            const button = document.createElement('button');
            button.className = 'suggestion-btn';
            button.textContent = text;
            button.onclick = () => {
                input.value = text;
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            };
            suggestionsContainer.appendChild(button);
        });
        // Add the container only if it has buttons in it
        if (suggestionsContainer.hasChildNodes()) {
            form.parentNode.insertBefore(suggestionsContainer, form);
        }
    }
});