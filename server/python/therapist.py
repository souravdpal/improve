import sys
import json
import os
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
apikey = os.getenv('thkey')

if not apikey:
    print(json.dumps({"error": "API key not found"}), file=sys.stderr)
    sys.exit(1)

# Setup memory directory
memory_folder = "mem"
os.makedirs(memory_folder, exist_ok=True)

# Read input
try:
    raw_data = sys.stdin.read()
    parsed = json.loads(raw_data)
except Exception as e:
    print(json.dumps({"error": f"Invalid input JSON: {str(e)}"}), file=sys.stderr)
    sys.exit(1)

# Extract fields
username = parsed.get('uname', '').strip()
summary = parsed.get('summary', '').strip()
mode = parsed.get('mode', '').strip().lower()
user_summary = parsed.get('userSummary', {})
chat_context = parsed.get('chatContext', [])  # Context passed from frontend

if not username or not summary or not user_summary or mode != "therapy":
    print(json.dumps({"error": "Missing or invalid fields in request"}), file=sys.stderr)
    sys.exit(1)

# Extract user profile and current state
profile = user_summary.get('profile', {})
current_state = user_summary.get('currentState', {})

# Define memory file
memory_file = os.path.join(memory_folder, f"{username}.json")

memory = []

# Load old memory
try:
    if os.path.exists(memory_file):
        with open(memory_file, 'r') as f:
            memory = json.load(f)
            if not isinstance(memory, list):
                memory = []
except Exception as e:
    print(json.dumps({"warning": f"Memory load failed: {str(e)}"}), file=sys.stderr)
    memory = []

# Generate prompt
def therapy_prompt():
    mem_context = "\n\nRecent Memories:\n"
    for i, chat in enumerate(memory[-5:]):
        mem_context += (
            f"Chat {i+1} ({chat.get('timestamp', '')}):\n"
            f"  {username}: {chat.get('user_message', '')}\n"
            f"  Hina: {chat.get('therapist_response', '')}\n\n"
        )
    return f"""
You are Hina, a sweet and supportive AI therapist for a young user named {username}. You're like a big sister or a nurturing mom. Always be gentle, warm, and kind. Speak in kid-friendly language. If they seem seriously sad or mention harm, gently suggest they talk to a trusted adult or call a helpline (988 in the US).
you and  {username} have chatting last time about {memory} this your history talk with  {username} so genrate responeses on the baisc of this  <|memory|>.

BE cautious for user memory dont forgot what you and user talked about you both talked about  {memory}


User info:
- Name: {profile.get("name", "Unknown")}
- Age: {profile.get("age", "Unknown")}
- Gender: {profile.get("gender", "Unknown")}
- Hobbies: {profile.get("hobbies", "None")}
- Motivation: {profile.get("motivation", "None")}
- Challenge: {profile.get("challenge", "None")}
- Pet Name: {profile.get("petname", "None")}
- Mood Today: {current_state.get("mood", "Unknown")}
- Current Goal: {current_state.get("goal", "None")}
- Tasks: {', '.join(current_state.get("tasks", []))}

Today's message from user: "{summary}"

{mem_context}

Your job is to respond with warmth and kindness in 3–5 sentences. Mention something from their profile or today's mood. Validate their feelings if they’re sad. Always end on a hopeful, uplifting note. Sign off as "Hina, your therapist".
"""

  # Debugging output
# Build message list
messages = [{"role": "system", "content": therapy_prompt()}]

# Add ongoing chat context if available
if isinstance(chat_context, list):
    for entry in chat_context:
        role = entry.get("role", "")
        content = entry.get("content", "")
        if role in ["user", "assistant"] and content:
            messages.append({"role": role, "content": content})

# Add the new message
messages.append({"role": "user", "content": summary})

# Generate response using Groq
try:
    client = Groq(api_key=apikey)
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.9,
        max_tokens=300,
        top_p=1,
        stream=False
    )

    response = completion.choices[0].message.content.strip()

    # Save to memory
    memory.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user_message": summary,
        "therapist_response": response,
        "mood": current_state.get("mood", "unknown")
    })
    memory = memory[-10:]  # limit memory file to last 10

    try:
        with open(memory_file, 'w') as f:
            json.dump(memory, f, indent=2)
    except Exception as e:
        print(json.dumps({"error": f"Failed to write memory: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

    # Output result
    print(json.dumps({
        "response": f"{response}"
    }))

except Exception as e:
    print(json.dumps({"error": f"Groq API error: {str(e)}"}), file=sys.stderr)
    sys.exit(1)
