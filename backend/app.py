from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import pickle
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = "mongodb+srv://sushmavangala3005:Sushma2305@cluster0.2inx41u.mongodb.net/jobshield?appName=Cluster0"
mongo = PyMongo(app)
db = mongo.db.users # Access the 'users' collection
analyses_collection = mongo.db.analyses # Collection for storing analyses

# Load model & vectorizer
try:
    model = pickle.load(open("model.pkl", "rb"))
    vectorizer = pickle.load(open("vectorizer.pkl", "rb"))
except FileNotFoundError as e:
    print(f"❌ Error loading model files: {e}")
    exit(1)

def preprocess(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('fullName')

    if db.find_one({"email": email}):
        return jsonify({"message": "Email already exists"}), 400

    hashed_password = generate_password_hash(password)
    db.insert_one({
        "fullName": full_name,
        "email": email,
        "password": hashed_password
    })
    return jsonify({"message": "Registration successful"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = db.find_one({"email": data.get('email')})

    if user and check_password_hash(user['password'], data.get('password')):
        return jsonify({"message": "Login successful", "user": user['fullName']}), 200
    
    return jsonify({"message": "Invalid email or password"}), 401

@app.route('/contact', methods=['POST'])
def contact():
    data = request.get_json()
    # Store contact message in a separate collection
    mongo.db.messages.insert_one(data)
    return jsonify({"message": "Message sent successfully"}), 200

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    title = data.get('title', '')
    company = data.get('company', '')
    experience = data.get('experience', '')
    salary = data.get('salary', '')
    description = data.get('description', '')
    requirements = data.get('requirements', '')

    # Combine everything
    full_text = f"{title} {company} {experience} {salary} {description} {requirements}"

    clean_text = preprocess(full_text)

    if len(clean_text.split()) < 10:
        return jsonify({
            "prediction": "INVALID INPUT",
            "probability": 0,
            "keywords": [],
            "message": "Please enter a meaningful job description"
        })
    
    # Add this BEFORE building full_text
    if len(description.strip().split()) < 5:
        return jsonify({
        "prediction": "INVALID INPUT",
        "probability": 0,
        "keywords": [],
        "message": "Please enter a meaningful job description (at least 5 words)"
    })

    unique_words = set(clean_text.split())
    if len(unique_words) < 6:
        return jsonify({
        "prediction": "INVALID INPUT",
        "probability": 0,
        "keywords": [],
        "message": "Please enter a meaningful job description"
    })


    vec = vectorizer.transform([clean_text])

    if vec.nnz == 0:
        return jsonify({
            "prediction": "UNCERTAIN",
            "probability": 0,
            "keywords": [],
            "message": "Input not recognized. Please enter a valid job description."
        })

    prob = model.predict_proba(vec)[0][1]

    result = "FAKE" if prob >= 0.75 else "REAL" if prob <= 0.25 else "UNCERTAIN"

    #words to display
    feature_names = vectorizer.get_feature_names_out()
    coefficients = model.coef_[0]

    vec_array = vec.toarray()[0]

    word_importance = []

    for i in vec_array.nonzero()[0]:
        word = feature_names[i]
        weight = coefficients[i]

        word_importance.append((word, weight))

    # Sort by importance
    word_importance = sorted(word_importance, key=lambda x: abs(x[1]), reverse=True)

    # Take top 10 words
    top_words = []
    for word, weight in word_importance[:10]:
        top_words.append({
            "word": word,
            "type": "fake" if weight > 0 else "real"
        })

    confidence = prob if result == "FAKE" else (1 - prob)    

    return jsonify({
        "prediction": result,
        "probability": float(confidence * 100),
        "keywords": top_words
    })

@app.route('/predict-and-save', methods=['POST'])
def predict_and_save():
    data = request.get_json()
    title = data.get('title', '')
    company = data.get('company', '')
    experience = data.get('experience', '')
    salary = data.get('salary', '')
    description = data.get('description', '')
    requirements = data.get('requirements', '')
    user_email = data.get('userEmail', '')

    print(f"🔍 Predict-and-save called for user: {user_email}")
    print(f"🔍 Data received: title='{title}', company='{company}', userEmail='{user_email}'")

    # Combine everything
    full_text = f"{title} {company} {experience} {salary} {description} {requirements}"
    clean_text = preprocess(full_text)

    if len(clean_text.split()) < 10:
        return jsonify({
            "prediction": "INVALID INPUT",
            "probability": 0,
            "keywords": [],
            "message": "Please enter a meaningful job description"
        })
    
    if len(description.strip().split()) < 5:
        return jsonify({
        "prediction": "INVALID INPUT",
        "probability": 0,
        "keywords": [],
        "message": "Please enter a meaningful job description (at least 5 words)"
    })

    unique_words = set(clean_text.split())
    if len(unique_words) < 6:
        return jsonify({
        "prediction": "INVALID INPUT",
        "probability": 0,
        "keywords": [],
        "message": "Please enter a meaningful job description"
    })

    vec = vectorizer.transform([clean_text])

    if vec.nnz == 0:
        return jsonify({
            "prediction": "UNCERTAIN",
            "probability": 0,
            "keywords": [],
            "message": "Input not recognized. Please enter a valid job description."
        })

    prob = model.predict_proba(vec)[0][1]
    result = "FAKE" if prob >= 0.75 else "REAL" if prob <= 0.25 else "UNCERTAIN"

    # words to display
    feature_names = vectorizer.get_feature_names_out()
    coefficients = model.coef_[0]
    vec_array = vec.toarray()[0]

    word_importance = []
    for i in vec_array.nonzero()[0]:
        word = feature_names[i]
        weight = coefficients[i]
        word_importance.append((word, weight))

    # Sort by importance
    word_importance = sorted(word_importance, key=lambda x: abs(x[1]), reverse=True)

    # Take top 10 words
    top_words = []
    for word, weight in word_importance[:10]:
        top_words.append({
            "word": word,
            "type": "fake" if weight > 0 else "real"
        })

    confidence = prob if result == "FAKE" else (1 - prob)

    # Save analysis to database
    if user_email:
        analysis_record = {
            "userEmail": user_email,
            "title": title,
            "company": company,
            "experience": experience,
            "salary": salary,
            "prediction": result,
            "probability": float(confidence * 100),
            "timestamp": datetime.now()
        }
        try:
            result_insert = analyses_collection.insert_one(analysis_record)
            print(f"✅ Analysis saved for {user_email}: {result_insert.inserted_id}")
        except Exception as e:
            print(f"❌ Error saving analysis for {user_email}: {e}")
    else:
        print("⚠️ No user email provided, analysis not saved")

    return jsonify({
        "prediction": result,
        "probability": float(confidence * 100),
        "keywords": top_words
    })

@app.route('/profile', methods=['GET'])
def get_profile():
    user_email = request.args.get('email', '')
    
    if not user_email:
        return jsonify({"message": "Email parameter required"}), 400

    # Get analyses for this user
    analyses = list(analyses_collection.find({"userEmail": user_email}).sort("timestamp", -1).limit(10))
    
    # Count statistics
    total_analyses = len(analyses)
    fake_count = sum(1 for a in analyses if a.get('prediction') == 'FAKE')
    real_count = sum(1 for a in analyses if a.get('prediction') == 'REAL')

    print(f"📊 Profile stats for {user_email}: {total_analyses} analyses, {fake_count} fake, {real_count} real")

    # Format analyses for response
    recent_analyses = []
    for analysis in analyses:
        recent_analyses.append({
            "title": analysis.get('title', ''),
            "company": analysis.get('company', ''),
            "prediction": analysis.get('prediction', 'UNCERTAIN'),
            "probability": analysis.get('probability', 0),
            "timestamp": analysis.get('timestamp', datetime.now()).isoformat()
        })

    return jsonify({
        "email": user_email,
        "analysisCount": total_analyses,
        "fakeCount": fake_count,
        "realCount": real_count,
        "recentAnalyses": recent_analyses
    }), 200

@app.route('/profile-by-name', methods=['GET'])
def get_profile_by_name():
    user_name = request.args.get('name', '')
    user = db.find_one({"fullName": user_name})

    if not user:
        return jsonify({"message": "User not found"}), 404

    user_email = user.get('email', '')
    
    # Get analyses for this user
    analyses = list(analyses_collection.find({"userEmail": user_email}).sort("timestamp", -1).limit(10))
    
    # Count statistics
    total_analyses = len(analyses)
    fake_count = sum(1 for a in analyses if a.get('prediction') == 'FAKE')
    real_count = sum(1 for a in analyses if a.get('prediction') == 'REAL')

    print(f"📊 Profile stats for {user_name} ({user_email}): {total_analyses} analyses, {fake_count} fake, {real_count} real")

    # Format analyses for response
    recent_analyses = []
    for analysis in analyses:
        recent_analyses.append({
            "title": analysis.get('title', ''),
            "company": analysis.get('company', ''),
            "prediction": analysis.get('prediction', 'UNCERTAIN'),
            "probability": analysis.get('probability', 0),
            "timestamp": analysis.get('timestamp', datetime.now()).isoformat()
        })

    return jsonify({
        "email": user_email,
        "analysisCount": total_analyses,
        "fakeCount": fake_count,
        "realCount": real_count,
        "recentAnalyses": recent_analyses
    }), 200

@app.route('/debug-analyses', methods=['GET'])
def debug_analyses():
    user_email = request.args.get('email', '')
    if not user_email:
        return jsonify({"message": "Email parameter required"}), 400
    
    # Get all analyses for this user
    analyses = list(analyses_collection.find({"userEmail": user_email}))
    
    print(f"🔍 Debug: Found {len(analyses)} analyses for {user_email}")
    
    return jsonify({
        "email": user_email,
        "totalAnalyses": len(analyses),
        "analyses": analyses
    }), 200

@app.route('/debug-all-analyses', methods=['GET'])
def debug_all_analyses():
    # Get all analyses in database
    analyses = list(analyses_collection.find({}))
    
    print(f"🔍 Debug: Total analyses in database: {len(analyses)}")
    print(f"🔍 Debug: Collection name: {analyses_collection.name}")
    print(f"🔍 Debug: Database name: {analyses_collection.database.name}")
    
    # Check all collections in the database
    collections = mongo.db.list_collection_names()
    print(f"🔍 Debug: All collections: {collections}")
    
    # Group by user
    by_user = {}
    for analysis in analyses:
        email = analysis.get('userEmail', 'unknown')
        if email not in by_user:
            by_user[email] = []
        by_user[email].append(analysis)
    
    return jsonify({
        "totalAnalyses": len(analyses),
        "byUser": by_user,
        "collections": collections,
        "collectionName": analyses_collection.name,
        "databaseName": analyses_collection.database.name
    }), 200

@app.route('/debug-users', methods=['GET'])
def debug_users():
    # Get all users
    users = list(db.find({}))
    
    print(f"🔍 Debug: Total users in database: {len(users)}")
    
    return jsonify({
        "totalUsers": len(users),
        "users": users
    }), 200

if __name__ == '__main__':
    app.run(debug=True)