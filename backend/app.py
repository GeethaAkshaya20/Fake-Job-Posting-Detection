from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import re

app = Flask(__name__)
CORS(app)

# Load model & vectorizer
model = pickle.load(open("model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))

def preprocess(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    description = data['description']

    clean_text = preprocess(description)
    vec = vectorizer.transform([clean_text])

    prob = model.predict_proba(vec)[0][1]

    result = "FAKE" if prob >= 0.7 else "REAL"

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

    return jsonify({
        "prediction": result,
        "probability": float(prob * 100),
        "keywords": top_words
    })

if __name__ == '__main__':
    app.run(debug=True)