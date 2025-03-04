from flask import Flask, request, jsonify
from flask_cors import CORS
import cohere

app = Flask(__name__)
CORS(app)

# Initialize Cohere V2 client for chat completions using your API key
co = cohere.ClientV2('')

def format_preferences_as_context(preferences):
    """Convert preferences dict into a context string for the AI."""
    context = "Please provide feedback with these preferences in mind:\n"
    for key, value in preferences.items():
        context += f"- {key}: {value}\n"

    # Additional bullet-point note if user wants bullet style
    if preferences.get("deliveryStyle") == "bullet":
        context += (
            "\nNote: The user prefers bullet-point style. Please format bullet points with each item on its own line, for example:\n"
            "- First bullet point\n"
            "- Second bullet point\n"
            "Keep it concise and readable.\n"
        )
    return context

@app.route('/generate-feedback', methods=['POST'])
def generate_feedback():
    """
    Existing endpoint to generate an initial AI response
    based on user preferences and an input prompt.
    """
    try:
        data = request.json
        user_preferences = data.get('preferences', {})
        user_input = data.get('input', '')
        context = data.get('context', '')
        use_context = data.get('useContext', False)
        
        system_content = format_preferences_as_context(user_preferences)
        
        # Add file context if provided
        if use_context and context:
            system_content += f"\n\nUse the following context to inform your response:\n{context}"
        
        messages = [
            {
                "role": "system",
                "content": system_content
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
    """
    Existing endpoint that modifies the AI response based on user feedback
    and returns a new improved response.
    """
    try:
        data = request.json
        user_preferences = data.get('preferences', {})
        original_input = data.get('input', '')
        user_feedback = data.get('feedback', '')
        context = data.get('context', '')
        use_context = data.get('useContext', False)
        
        system_content = format_preferences_as_context(user_preferences)
        
        # Add file context if provided
        if use_context and context:
            system_content += f"\n\nUse the following context to inform your response:\n{context}"
        
        messages = [
            {
                "role": "system",
                "content": system_content
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

@app.route('/ask-followup', methods=['POST'])
def ask_followup():
    """
    NEW endpoint that returns a single clarifying question about a user's feedback.
    This ensures we only get one question, avoiding duplicates in the UI.
    """
    try:
        data = request.json
        user_preferences = data.get('preferences', {})
        # The user feedback describing what was highlighted, rating, and comment.
        feedback_item = data.get('feedbackItem', {})
        # The actual content the user is giving feedback on.
        original_content = data.get('originalContent', '')
        context = data.get('context', '')
        use_context = data.get('useContext', False)
        
        system_content = format_preferences_as_context(user_preferences)
        
        # Add file context if provided
        if use_context and context:
            system_content += f"\n\nUse the following context to inform your response:\n{context}"

        # Build a conversation to produce a single clarifying question.
        # We combine system context, the original content, and the user's feedback item.
        messages = [
            {
                "role": "system",
                "content": system_content
            },
            {
                "role": "assistant",
                "content": f"Original Content:\n{original_content}"
            },
            {
                "role": "user",
                "content": f"User Feedback:\n{feedback_item}"
            },
            {
                "role": "user",
                "content": "Please ask one clarifying question about how to improve the highlighted text."
            }
        ]

        response = co.chat(
            model="c4ai-aya-expanse-32b",
            messages=messages
        )

        clarifying_question = response.message.content[0].text.strip()

        return jsonify({
            'success': True,
            'question': clarifying_question
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
