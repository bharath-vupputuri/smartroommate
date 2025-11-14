from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI
import os
from dotenv import load_dotenv
import random
from pymongo import MongoClient
from bson import ObjectId
import json

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
openai_client = None
try:
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key.strip():
        openai_client = OpenAI(api_key=api_key.strip())
        print("✓ OpenAI client initialized successfully")
    else:
        print("⚠ Warning: OPENAI_API_KEY not found in environment variables")
        print("   Match explanations will use fallback mode (no AI)")
        print("   To enable AI explanations, add OPENAI_API_KEY to your .env file")
except Exception as e:
    print(f"⚠ Warning: Could not initialize OpenAI client: {type(e).__name__}: {str(e)}")
    print("   Match explanations will use fallback mode (no AI)")

# Initialize MongoDB
mongo_client = None
db = None
users_collection = None

try:
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    # Test the connection
    mongo_client.admin.command('ping')
    db = mongo_client["smartroommate"]
    users_collection = db["users"]
    print("MongoDB connected successfully")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    print("Please ensure MongoDB is running on localhost:27017")
    print("You can install MongoDB or update MONGODB_URI in .env file")
    mongo_client = None
    db = None
    users_collection = None

# Helper function to convert ObjectId to string
def serialize_user(user):
    if user and '_id' in user:
        user['id'] = str(user['_id'])
        del user['_id']
    return user

# ----- Feature mappers -----
def one_hot_sleep(v):      return [1, 0] if v == "early" else [0, 1]
def map_yesno(v):          return [1] if str(v).lower() == "yes" else [0]
def map_noise(v):
    m = {"low":[1,0,0], "medium":[0,1,0], "high":[0,0,1]}
    return m.get(str(v).lower(), [0,1,0])
def map_gender(v):
    m = {"male":[1,0,0], "female":[0,1,0], "other":[0,0,1]}
    return m.get(str(v).lower(), [0,0,1])
def map_study_time(v):     return [1,0] if str(v).lower()=="morning" else [0,1]

def embed_text_openai(text):
    """Get embedding from OpenAI API"""
    if openai_client is None:
        # Fallback to zero vector if OpenAI is not available
        return np.zeros(1536)  # text-embedding-3-small dimension
    
    if not text or not str(text).strip():
        return np.zeros(1536)
    
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return np.array(response.data[0].embedding)
    except Exception as e:
        print(f"Error getting OpenAI embedding: {type(e).__name__}: {str(e)}")
        return np.zeros(1536)

STRUCT_W = 0.6
TEXT_W   = 0.4

def build_vector(u):
    """Build feature vector combining structured features and OpenAI embeddings"""
    s = []
    s += one_hot_sleep(u.get("sleep","early"))
    s += map_yesno(u.get("clean","yes"))
    s += map_noise(u.get("noise","low"))
    s += [ (u.get("age",0) / 100.0) ]
    s += map_gender(u.get("gender","other"))
    s += map_yesno(u.get("pets","no"))
    s += map_yesno(u.get("smoking","no"))
    s += map_study_time(u.get("study_time","morning"))
    s_vec = np.array(s, dtype=float) * STRUCT_W

    hobbies = u.get("hobbies", [])
    if isinstance(hobbies, list):
        hobbies_text = " ".join(hobbies)
    else:
        hobbies_text = str(hobbies or "")
    txt = f"{u.get('bio','')} {hobbies_text}".strip()
    t_vec = embed_text_openai(txt) * TEXT_W

    return np.concatenate([s_vec, t_vec])

def explain_match_openai(u1, u2):
    """Use OpenAI to generate match explanation"""
    if openai_client is None:
        print("OpenAI client not available, using fallback explanation")
        return explain_match_simple(u1, u2)
    
    try:
        prompt = f"""Analyze the compatibility between two potential roommates based on their profiles.

Person 1:
- Name: {u1.get('name', 'Unknown')}
- Age: {u1.get('age', 'N/A')}
- Sleep Schedule: {u1.get('sleep', 'N/A')}
- Cleanliness: {u1.get('clean', 'N/A')}
- Noise Tolerance: {u1.get('noise', 'N/A')}
- Gender: {u1.get('gender', 'N/A')}
- Pets: {u1.get('pets', 'N/A')}
- Smoking: {u1.get('smoking', 'N/A')}
- Study Time: {u1.get('study_time', 'N/A')}
- Hobbies: {', '.join(u1.get('hobbies', [])) if isinstance(u1.get('hobbies'), list) else u1.get('hobbies', 'N/A')}
- Bio: {u1.get('bio', 'N/A')}

Person 2:
- Name: {u2.get('name', 'Unknown')}
- Age: {u2.get('age', 'N/A')}
- Sleep Schedule: {u2.get('sleep', 'N/A')}
- Cleanliness: {u2.get('clean', 'N/A')}
- Noise Tolerance: {u2.get('noise', 'N/A')}
- Gender: {u2.get('gender', 'N/A')}
- Pets: {u2.get('pets', 'N/A')}
- Smoking: {u2.get('smoking', 'N/A')}
- Study Time: {u2.get('study_time', 'N/A')}
- Hobbies: {', '.join(u2.get('hobbies', [])) if isinstance(u2.get('hobbies'), list) else u2.get('hobbies', 'N/A')}
- Bio: {u2.get('bio', 'N/A')}

Provide a brief, friendly explanation (2-3 sentences) of why these two people would be compatible as roommates. Focus on shared values, complementary lifestyles, and similar preferences. Be concise and specific."""

        print(f"Calling OpenAI API for match explanation between {u1.get('name')} and {u2.get('name')}")
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes roommate compatibility."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        explanation = response.choices[0].message.content.strip()
        print(f"OpenAI explanation received: {explanation[:50]}...")
        return explanation
    except Exception as e:
        print(f"Error getting OpenAI explanation: {type(e).__name__}: {str(e)}")
        print("Falling back to simple explanation")
        return explain_match_simple(u1, u2)

def explain_match_simple(u1, u2):
    """Simple fallback explanation"""
    reasons = []
    if u1.get("sleep")==u2.get("sleep"): reasons.append("same sleep schedule")
    if u1.get("clean")==u2.get("clean"): reasons.append("similar cleanliness")
    if u1.get("noise")==u2.get("noise"): reasons.append("noise tolerance matches")
    if u1.get("gender")==u2.get("gender"): reasons.append("same gender")
    if u1.get("pets")==u2.get("pets"): reasons.append("same pet preference")
    if u1.get("smoking")==u2.get("smoking"): reasons.append("same smoking habit")
    if u1.get("study_time")==u2.get("study_time"): reasons.append("same study time preference")
    if not reasons: reasons.append("textual similarity in bio/hobbies")
    return ", ".join(reasons)

# ----- Routes -----
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "ok",
        "mongodb": "connected" if users_collection is not None else "disconnected",
        "openai": "connected" if openai_client is not None else "disconnected"
    }
    
    if users_collection is not None:
        try:
            # Test MongoDB connection
            users_collection.find_one()
            health_status["mongodb"] = "connected"
        except Exception as e:
            health_status["mongodb"] = f"error: {str(e)}"
            health_status["status"] = "error"
    
    if openai_client is not None:
        try:
            # Test OpenAI connection with a simple request
            openai_client.models.list()
            health_status["openai"] = "connected"
        except Exception as e:
            health_status["openai"] = f"error: {str(e)}"
            if health_status["status"] == "ok":
                health_status["status"] = "warning"
    
    status_code = 200 if health_status["mongodb"] == "connected" else 503
    return jsonify(health_status), status_code

@app.route('/api/submit', methods=['POST'])
def submit_profile():
    data = request.json or {}
    
    # Validate username
    username = data.get("username", "").strip()
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    # Check if username already exists
    if users_collection is not None:
        existing = users_collection.find_one({"username": username})
        if existing:
            return jsonify({"error": "Username already taken"}), 400
    else:
        # Fallback: check in-memory (shouldn't happen if MongoDB is working)
        existing = [u for u in [] if u.get("username") == username]
        if existing:
            return jsonify({"error": "Username already taken"}), 400
    
    # Build vector and store it
    user_vector = build_vector(data)
    data["vector"] = user_vector.tolist()  # Convert numpy array to list for MongoDB
    
    # Insert into MongoDB
    if users_collection is not None:
        result = users_collection.insert_one(data)
        user_id = str(result.inserted_id)
    else:
        # Fallback (shouldn't happen)
        return jsonify({"error": "Database not available"}), 500
    
    return jsonify({"message": "Profile submitted", "id": user_id, "username": username})

@app.route('/api/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    """Get profile by user ID"""
    if users_collection is not None:
        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return jsonify({"error":"User not found"}), 404
            user = serialize_user(user)
            # Remove vector from response (not needed for frontend)
            if 'vector' in user:
                del user['vector']
            return jsonify(user)
        except Exception as e:
            return jsonify({"error":"Invalid user ID"}), 400
    return jsonify({"error":"Database not available"}), 500

@app.route('/api/profile/username/<username>', methods=['GET'])
def get_profile_by_username(username):
    """Get profile by username"""
    if users_collection is not None:
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error":"User not found"}), 404
        user = serialize_user(user)
        # Remove vector from response
        if 'vector' in user:
            del user['vector']
        return jsonify(user)
    return jsonify({"error":"Database not available"}), 500

@app.route('/api/profile/<user_id>', methods=['PUT'])
def update_profile(user_id):
    """Update profile by user ID"""
    if users_collection is None:
        return jsonify({"error":"Database not available"}), 500
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error":"User not found"}), 404
        
        incoming = request.json or {}
        
        # If username is being updated, check uniqueness
        if "username" in incoming and incoming["username"] != user.get("username"):
            new_username = incoming["username"].strip()
            existing = users_collection.find_one({"username": new_username})
            if existing and str(existing["_id"]) != user_id:
                return jsonify({"error": "Username already taken"}), 400
        
        # Update the user data
        for key, value in incoming.items():
            user[key] = value
        
        # Rebuild vector with updated data
        user["vector"] = build_vector(user).tolist()
        
        # Update in MongoDB
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": user}
        )
        
        return jsonify({"message":"Profile updated"})
    except Exception as e:
        return jsonify({"error": f"Error updating profile: {str(e)}"}), 400

@app.route('/api/match/<user_id>', methods=['GET'])
def get_matches(user_id):
    """Get matches by user ID"""
    if users_collection is None:
        return jsonify({"error":"Database not available"}), 500
    
    try:
        target_user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            return jsonify({"error":"User not found"}), 404
        
        # Get all users except the target
        all_users = list(users_collection.find({"_id": {"$ne": ObjectId(user_id)}}))
        if len(all_users) < 1:
            return jsonify([])
        
        # Get target vector
        target_vector = np.array(target_user.get("vector", []))
        if len(target_vector) == 0:
            return jsonify([])
        
        # Get all other user vectors
        user_vectors_list = []
        user_list = []
        for u in all_users:
            vec = u.get("vector", [])
            if len(vec) > 0:
                user_vectors_list.append(vec)
                user_list.append(u)
        
        if len(user_vectors_list) == 0:
            return jsonify([])
        
        # Calculate similarities
        target = target_vector.reshape(1, -1)
        sims = cosine_similarity(target, np.array(user_vectors_list))[0]
        
        # Get top 3 matches
        k = min(3, len(sims))
        top_indices = np.argpartition(-sims, k-1)[:k]
        top_indices = top_indices[np.argsort(-sims[top_indices])]
        
        results = []
        for idx in top_indices:
            matched_user = user_list[idx]
            matched_user = serialize_user(matched_user)
            results.append({
                "name": matched_user.get("name",""),
                "similarity": float(np.round(sims[idx], 3)),
                "reason": explain_match_openai(target_user, matched_user),
                "profile": {
                    "age": matched_user.get("age"),
                    "sleep": matched_user.get("sleep"),
                    "clean": matched_user.get("clean"),
                    "noise": matched_user.get("noise"),
                    "gender": matched_user.get("gender"),
                    "pets": matched_user.get("pets"),
                    "smoking": matched_user.get("smoking"),
                    "study_time": matched_user.get("study_time"),
                    "hobbies": matched_user.get("hobbies"),
                    "bio": matched_user.get("bio"),
                }
            })
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Error finding matches: {str(e)}"}), 400

@app.route('/api/match/username/<username>', methods=['GET'])
def get_matches_by_username(username):
    """Get matches by username"""
    if users_collection is None:
        return jsonify({"error":"Database not available"}), 500
    
    user = users_collection.find_one({"username": username})
    if not user:
        return jsonify({"error":"User not found"}), 404
    
    user_id = str(user["_id"])
    return get_matches(user_id)

@app.route('/api/analytics/users', methods=['GET'])
def get_all_users_analytics():
    """Get all users for analytics (without vectors)"""
    if users_collection is None:
        return jsonify({"error":"Database not available"}), 500
    
    try:
        users = list(users_collection.find({}, {"vector": 0}))  # Exclude vectors
        # Serialize all users
        for user in users:
            serialize_user(user)
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": f"Error fetching users: {str(e)}"}), 500

@app.route('/api/analytics/stats', methods=['GET'])
def get_analytics_stats():
    """Get aggregated statistics for analytics"""
    if users_collection is None:
        return jsonify({"error":"Database not available"}), 500
    
    try:
        all_users = list(users_collection.find({}, {"vector": 0}))
        
        if len(all_users) == 0:
            return jsonify({
                "total_users": 0,
                "age_distribution": [],
                "sleep_distribution": {},
                "clean_distribution": {},
                "noise_distribution": {},
                "gender_distribution": {},
                "pets_distribution": {},
                "smoking_distribution": {},
                "study_time_distribution": {},
                "hobbies_popularity": {},
                "average_age": 0
            })
        
        # Age distribution
        ages = [u.get("age", 0) for u in all_users if u.get("age")]
        age_ranges = {
            "18-22": 0,
            "23-26": 0,
            "27-30": 0,
            "31-35": 0,
            "36+": 0
        }
        for age in ages:
            if 18 <= age <= 22:
                age_ranges["18-22"] += 1
            elif 23 <= age <= 26:
                age_ranges["23-26"] += 1
            elif 27 <= age <= 30:
                age_ranges["27-30"] += 1
            elif 31 <= age <= 35:
                age_ranges["31-35"] += 1
            else:
                age_ranges["36+"] += 1
        
        # Count distributions
        def count_field(field):
            counts = {}
            for u in all_users:
                val = u.get(field, "unknown")
                counts[val] = counts.get(val, 0) + 1
            return counts
        
        # Hobbies popularity
        hobbies_count = {}
        for u in all_users:
            hobbies = u.get("hobbies", [])
            if isinstance(hobbies, list):
                for hobby in hobbies:
                    hobbies_count[hobby] = hobbies_count.get(hobby, 0) + 1
            elif hobbies:
                hobbies_count[str(hobbies)] = hobbies_count.get(str(hobbies), 0) + 1
        
        stats = {
            "total_users": len(all_users),
            "age_distribution": [{"age": k, "count": v} for k, v in age_ranges.items()],
            "sleep_distribution": count_field("sleep"),
            "clean_distribution": count_field("clean"),
            "noise_distribution": count_field("noise"),
            "gender_distribution": count_field("gender"),
            "pets_distribution": count_field("pets"),
            "smoking_distribution": count_field("smoking"),
            "study_time_distribution": count_field("study_time"),
            "hobbies_popularity": hobbies_count,
            "average_age": sum(ages) / len(ages) if ages else 0
        }
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": f"Error generating stats: {str(e)}"}), 500

@app.route('/api/seed', methods=['POST'])
def seed():
    try:
        if users_collection is None:
            return jsonify({"error":"Database not available. Please ensure MongoDB is running."}), 500
        
        # Test MongoDB connection
        try:
            users_collection.find_one()
        except Exception as conn_err:
            return jsonify({"error": f"MongoDB connection error: {str(conn_err)}"}), 500
        
        n = int(request.args.get("n", 12))
        bios = [
            "Quiet and clean, prefers peaceful study nights.",
            "Night owl, loves movies, music and game nights.",
            "Early riser, gym in the morning, enjoys calm spaces.",
            "Outgoing and social, okay with gatherings.",
            "Organized, tidy, values quiet reading time."
        ]
        hobbies_all = ["reading","gaming","music","cooking","sports","hiking","gym","art"]
        genders = ["male","female","other"]
        
        # Random first and last names
        first_names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", 
                       "Sam", "Jamie", "Cameron", "Dakota", "Skylar", "River", "Phoenix", "Blake",
                       "Sage", "Rowan", "Finley", "Emery", "Hayden", "Reese", "Parker", "Drew",
                       "Charlie", "Logan", "Noah", "Emma", "Olivia", "Liam", "Sophia", "Mason",
                       "Isabella", "Ethan", "Mia", "Aiden", "Charlotte", "Lucas", "Amelia", "Henry"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                      "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas",
                      "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
                      "Clark", "Lewis", "Robinson", "Walker", "Young", "King", "Wright", "Scott"]
        
        seeded_count = 0
        errors = []
        
        for i in range(n):
            try:
                # Generate unique username
                first = random.choice(first_names)
                last = random.choice(last_names)
                username = f"{first.lower()}{last.lower()}{random.randint(100, 999)}"
                
                # Ensure username is unique (limit retries to avoid infinite loop)
                max_retries = 10
                retry_count = 0
                while users_collection.find_one({"username": username}) and retry_count < max_retries:
                    username = f"{first.lower()}{last.lower()}{random.randint(100, 999)}"
                    retry_count += 1
                
                if retry_count >= max_retries:
                    errors.append(f"Could not generate unique username for user {i+1}")
                    continue
                
                u = {
                    "username": username,
                    "name": f"{first} {last}",
                    "age": random.randint(18, 35),
                    "sleep": random.choice(["early","late"]),
                    "clean": random.choice(["yes","no"]),
                    "noise": random.choice(["low","medium","high"]),
                    "gender": random.choice(genders),
                    "pets": random.choice(["yes","no"]),
                    "smoking": random.choice(["yes","no"]),
                    "study_time": random.choice(["morning","evening"]),
                    "hobbies": random.sample(hobbies_all, k=2),
                    "bio": random.choice(bios)
                }
                
                # Build and store vector
                try:
                    vector = build_vector(u)
                    u["vector"] = vector.tolist()
                except Exception as vec_err:
                    errors.append(f"Error building vector for user {i+1}: {str(vec_err)}")
                    continue
                
                # Insert into MongoDB
                try:
                    users_collection.insert_one(u)
                    seeded_count += 1
                except Exception as insert_err:
                    errors.append(f"Error inserting user {i+1}: {str(insert_err)}")
                    continue
                    
            except Exception as user_err:
                errors.append(f"Error creating user {i+1}: {str(user_err)}")
                continue
        
        total = users_collection.count_documents({})
        
        response = {
            "seeded": seeded_count,
            "total": total,
            "requested": n
        }
        
        if errors:
            response["errors"] = errors[:5]  # Limit error messages
            response["warning"] = f"Some users failed to seed. {len(errors)} errors occurred."
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": f"Seed operation failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
