from flask import Flask, request, jsonify
from flask_cors import CORS
import cohere

app = Flask(__name__)
CORS(app)

# Initialize Cohere V2 client for chat completions using your API key
co = cohere.ClientV2('ZqrxYS8F92sgwx3pizoYDFTZM9BpVRl6BFcy98tT')

def format_preferences_as_context(preferences):
    """Convert preferences dict into a context string for the AI."""
    context = "Please provide feedback with these preferences in mind:\n"
    for key, value in preferences.items():
        context += f"- {key}: {value}\n"
    return context

@app.route('/generate-feedback', methods=['POST'])
def generate_feedback():
    try:
        data = request.json
        user_preferences = data.get('preferences', {})
        user_input = data.get('input', '')
        
        messages = [
            {
                "role": "system",
                "content": format_preferences_as_context(user_preferences)
            },
            {
                "role": "user",
                "content": user_input
            }
        ]
        
        response = co.chat(
            model="c4ai-aya-expanse-32b",
            messages=messages
        )
        
        assistant_response = response.message.content[0].text.strip()
        
        return jsonify({
            'success': True,
            'feedback': assistant_response
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/regenerate-feedback', methods=['POST'])
def regenerate_feedback():
    try:
        data = request.json
        user_preferences = data.get('preferences', {})
        original_input = data.get('input', '')
        user_feedback = data.get('feedback', '')
        
        messages = [
            {
                "role": "system",
                "content": format_preferences_as_context(user_preferences)
            },
            {
                "role": "user",
                "content": original_input
            },
            {
                "role": "assistant",
                "content": f"Previous Response Feedback: {user_feedback}"
            },
            {
                "role": "user",
                "content": "Please provide a new, improved response taking into account the feedback:"
            }
        ]
        
        response = co.chat(
            model="c4ai-aya-expanse-32b",
            messages=messages
        )
        
        assistant_response = response.message.content[0].text.strip()
        
        return jsonify({
            'success': True,
            'feedback': assistant_response
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
