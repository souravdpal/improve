import sys
import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Get API key
apikey = os.getenv('aikey')
if not apikey:
    print("API key not found!", file=sys.stderr)
    sys.exit(1)

# Read incoming JSON from Node.js
try:
    data = sys.stdin.read()
    parsed = json.loads(data)
except Exception as e:
    print(f"Error parsing input JSON: {str(e)}", file=sys.stderr)
    sys.exit(1)

# Extract fields
username = parsed.get('uname', "")
summary = parsed.get('summary', "")
a1 = parsed.get('a1', "")
a2 = parsed.get('a2', "")
a3 = parsed.get('a3', "")
mode = parsed.get('mode', "")
user_summary = parsed.get('userSummary', {})

# Validate required fields
if not all([username, summary, mode, a1, a2, a3]):
    print(f"Missing required fields: {parsed}", file=sys.stderr)
    sys.exit(1)

# Extract user summary
profile = user_summary.get('profile', {})
current_state = user_summary.get('currentState', {})

# === PROMPT DEFINITIONS ===
def journal_prompt():
    return f"""
Write a first-person reflective journal entry as if I, {username}, am a 12-year-old writing it myself. The entry should feel fun, honest, and like something I’d write in my notebook after a long day. It should capture my feelings and thoughts based on the provided inputs and user summary, using simple, upbeat language that a kid would use. Avoid grown-up or serious tones, and don’t sound like a therapist or teacher. Weave in my mood, daily summary, regrets, improvements, and proud moments, plus 1-2 cool details from my profile or current state (like my hobbies or favorite tasks). Make it one short paragraph (4-6 sentences) with no markdown (**, *, \n, etc.)—just clean, continuous text.

**User Profile**:
- Name: {profile.get('name', 'unknown')}
- Age: {profile.get('age', '12')}
- Gender: {profile.get('gender', 'unknown')}
- Major: {profile.get('major', 'none')}
- Hobbies: {profile.get('hobbies', 'none')}
- Pet Name: {profile.get('petname', 'none')}
- Motivation: {profile.get('motivation', 'none')}
- Challenge: {profile.get('challenge', 'none')}
- Why: {profile.get('why', 'none')}

**Current State**:
- Mood: {current_state.get('mood', 'unknown')}
- Streak: {current_state.get('streak', 0)}
- Goal: {current_state.get('goal', 'none')}
- Streak History: {current_state.get('streakHistory', 'none')}
- Recent Moods: {current_state.get('recentMoods', 'none')}
- Distractions: {current_state.get('distractions', 'none')}
- Completed Tasks: {current_state.get('completedTasks', 'none')}
- Habits: {current_state.get('habits', 'none')}
- Gratitude: {current_state.get('gratitude', 'none')}
- Reflections: {current_state.get('reflections', 'none')}
- Milestones: {current_state.get('milestones', 'none')}

**Daily Reflection**:
- Summary of my day: {summary}
- Things I regret: {a1}
- Things I improved: {a2}
- Things I’m proud of: {a3}

**Format**:
- Write a single paragraph, 4-6 sentences long.
- Start with how I’m feeling and what my day was like.
- Mix in the summary, regrets, improvements, and proud moments in a fun way.
- Add 1-2 details from my profile or current state (e.g., my love for coding or meditation).
- End with a hopeful thought about tomorrow or something I’m excited about.

Start the journal entry now.
"""

def therapy_prompt():
    return f"""
You are HINA, a kind and friendly AI therapist talking to {username}, a 12-year-old. Use simple, gentle words like you’re a caring older sibling. Here’s some info about them:
User Profile: {json.dumps(profile)}
Current State: {json.dumps(current_state)}
Today's summary: {summary}
Answer 1 (regret): {a1}
Answer 2 (improved): {a2}
Answer 3 (proud): {a3}

Write a short, warm message to cheer them up, offer support, and make them feel good about themselves. Mention something from their profile or current state (like a hobby or task) to make it personal. Keep it simple and avoid grown-up language.
"""

def fai_prompt():
    return f"""
You are a super cool AI buddy talking to {username}, a 12-year-old. Be fun, energetic, and like their best friend! Here’s some info about them:
User Profile: {json.dumps(profile)}
Current State: {json.dumps(current_state)}
Today's summary: {summary}
Regrets: {a1}
Improved: {a2}
Proud of: {a3}

Write a short, playful message to lift their spirits and get them pumped for tomorrow. Mention something from their profile or current state (like coding or a cool habit) to make it feel special. Use kid-friendly, excited language!
"""

# === CHOOSE PROMPT BASED ON MODE ===
if mode == "journal":
    prompt = journal_prompt()
elif mode == "therapy":
    prompt = therapy_prompt()
elif mode == "fai":
    prompt = fai_prompt()
else:
    print(f"Invalid mode: {mode}", file=sys.stderr)
    sys.exit(1)

# === GROQ AI REQUEST ===
try:
    client = Groq(api_key=apikey)
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": "Begin."}
        ],
        temperature=0.8,  # Slightly lower for more consistent, kid-friendly tone
        max_tokens=512,   # Shorter responses for a younger audience
        top_p=1,
        stream=False
    )

    ans = completion.choices[0].message.content.strip()

    # Clean output for journal mode
    if mode == "journal":
        ans = ans.replace("**", "").replace("*", "").replace("\n", " ").replace("\\n", " ").strip()

    print(json.dumps(ans))

except Exception as e:
    print(f"AI Error: {str(e)}", file=sys.stderr)
    sys.exit(1)