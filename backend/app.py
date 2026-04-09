from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import pickle
import re

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = "mongodb+srv://sushmavangala3005:Sushma2305@cluster0.2inx41u.mongodb.net/jobshield?appName=Cluster0"
mongo = PyMongo(app)
db = mongo.db.users # Access the 'users' collection

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
    location = data.get('location', '')
    salary = data.get('salary', '')
    description = data.get('description', '')
    requirements = data.get('requirements', '')

    # Combine everything
    full_text = f"{title} {company} {location} {description} {requirements} {salary}"

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

if __name__ == '__main__':
    app.run(debug=True)