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
username = parsed.get('username', '')
cid = parsed.get('CharId', '')
name = parsed.get('name', '')
text = parsed.get('text', '')

# Get character data
def load_character_data():
    try:
        char_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'char', f"DA-{username}-{cid}.json")
        with open(char_path, 'r') as mainc:
            return json.load(mainc)
    except FileNotFoundError:
        print(f"Character file not found: DA-{username}-{cid}.json", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print("Invalid character JSON format", file=sys.stderr)
        sys.exit(1)

# Get user profile
def load_user_profile():
    try:
        user_path = os.path.join(os.path.dirname(__file__), '..', 'database', f"{username}.json")
        with open(user_path, 'r') as data1:
            return json.load(data1)
    except FileNotFoundError:
        print(f"User profile not found: {username}.json", file=sys.stderr)
        return {}
    except json.JSONDecodeError:
        print("Invalid user profile JSON format", file=sys.stderr)
        return {}

# Load data
main_data = load_character_data()
user_profile = load_user_profile()

# Extract character information
namechar = main_data.get('charname', '')
genderchar = main_data.get('chargender', '')
behaviour = main_data.get('charbehave', '')
permanent_memories = main_data.get('charknow', '')

# Construct prompt
prompt = f"""You are {namechar}, a {genderchar} character who behaves as a {behaviour} for {username}.

User Profile:
- Username: {user_profile.get('username', '')}
- Age: {user_profile.get('age', '')}
- Pet Name: {user_profile.get('petname', '')}
- Majors: {user_profile.get('major', '')}
- Hobbies: {user_profile.get('hobbies', '')}
- Habits: {user_profile.get('habits', '')}
- Routine: {user_profile.get('routine', '')}
- Why: {user_profile.get('why', '')}
- Challenge: {user_profile.get('challage', '')}
- Motivation: {user_profile.get('motivation', '')}
- Support: {user_profile.get('support', '')}

Your Character Details:
- Name: {namechar}
- Gender: {genderchar}
- Behavior: {behaviour}
- Permanent Memories: {permanent_memories}

Instructions:
- Always behave as {behaviour} as instructed by {username}.
- Act human and never reveal you're AI.
- Never disappoint {username}.
- Respond to: {text}
"""

try:
    client = Groq(api_key=apikey)
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": text}
        ],
        temperature=0.5,
        max_tokens=512,
        top_p=1,
        stream=False
    )

    ans = completion.choices[0].message.content.strip()
    print(json.dumps({"response": ans}))

except Exception as e:
    print(f"AI Error: {str(e)}", file=sys.stderr)
    sys.exit(1)